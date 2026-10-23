// EL MISMO BUCLE, CON OTRO MOTOR: el Agent Development Kit (ADK) de Google para TypeScript.
// Se activa con MOTOR = "adk" en wrangler.jsonc. Hace lo mismo que bucle.ts (el modelo decide → el
// programa ejecuta la herramienta → el resultado vuelve al contexto → se repite), pero el ciclo lo
// maneja ADK en vez de nuestras 30 líneas. Lo que no cambia:
//   - las herramientas se definen una sola vez, en herramientas/ (aquí solo se "traducen" a ADK);
//   - la traza tiene el mismo formato, así que el frontend, el MCP y las bitácoras no notan la diferencia;
//   - la memoria persistente sigue en el Durable Object (ADK solo recuerda la corrida en curso).
import {
  BaseLlm, FunctionTool, Gemini, InMemorySessionService, LlmAgent, Runner,
  getFunctionCalls, getFunctionResponses, isLlmCallsLimitExceededError, toGeminiSchema,
  type BaseLlmConnection, type LlmRequest, type LlmResponse,
} from "@google/adk";
import type { Env, EsquemaJson, Herramienta, PasoTraza } from "../tipos";
import { ejecutarHerramienta } from "../herramientas";
import { modeloSimulado, type Contenido, type Declaracion } from "./modelo";
import { recortar, resumen, type ConfigBucle, type ResultadoBucle } from "./bucle";

type Contexto = { env: Env; traza: PasoTraza[] };

/** Traduce una herramienta del registro (herramientas/) a una FunctionTool de ADK. */
function adaptar(h: Herramienta, ctx: Contexto, lista: Herramienta[]): FunctionTool<ReturnType<typeof toGeminiSchema>> {
  return new FunctionTool({
    name: h.nombre,
    description: h.descripcion,
    parameters: toGeminiSchema(h.parametros),
    // Igual que en bucle.ts: si la herramienta falla, el error vuelve al modelo como resultado.
    execute: async (args) => {
      try {
        return { resultado: recortar(await ejecutarHerramienta(h.nombre, (args ?? {}) as Record<string, unknown>, ctx, lista)) };
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
  });
}

/** Las terminales (entregar_borrador, terminar_sin_novedad, responder): guardan lo entregado y cierran. */
function terminal(d: Declaracion, finales: Map<string, Record<string, unknown>>): FunctionTool<ReturnType<typeof toGeminiSchema>> {
  return new FunctionTool({
    name: d.name,
    description: d.description,
    parameters: toGeminiSchema(d.parameters as EsquemaJson),
    execute: (args, toolContext) => {
      finales.set(d.name, (args ?? {}) as Record<string, unknown>);
      if (toolContext) toolContext.actions.skipSummarization = true;   // no hace falta que el modelo vuelva a hablar
      return { ok: true };
    },
  });
}

/** Sin clave de Gemini: el mismo modelo simulado de modelo.ts, envuelto para que ADK lo pueda usar. */
class ModeloSimuladoAdk extends BaseLlm {
  constructor() {
    super({ model: "simulado" });
  }
  async *generateContentAsync(peticion: LlmRequest): AsyncGenerator<LlmResponse, void> {
    const r = modeloSimulado({
      instrucciones: "",
      contenidos: peticion.contents as unknown as Contenido[],
      herramientas: Object.keys(peticion.toolsDict).map((name) => ({ name, description: "", parameters: {} })),
    });
    yield { content: r.contenido as unknown as LlmResponse["content"], modelVersion: "simulado" };
  }
  async connect(): Promise<BaseLlmConnection> {
    throw new Error("El modelo simulado no tiene modo en vivo.");
  }
}

export async function ejecutarBucleAdk(env: Env, cfg: ConfigBucle): Promise<ResultadoBucle> {
  const traza: PasoTraza[] = [];
  const ctx: Contexto = { env, traza };
  const t0 = Date.now();
  const finales = new Map<string, Record<string, unknown>>();
  const nombresTerminales = new Set(cfg.terminales.map((d) => d.name));
  const nombreModelo = (env.GEMINI_MODELOS ?? "gemini-3.6-flash").split(",")[0].trim();
  let modeloUsado = env.GEMINI_API_KEY ? nombreModelo : "simulado";
  let tokens = 0;
  let textoLibre = "";
  traza.push({ n: 1, tipo: "encargo", detalle: cfg.encargo });

  try {
    const agente = new LlmAgent({
      name: "agente_ene",
      model: env.GEMINI_API_KEY ? new Gemini({ model: nombreModelo, apiKey: env.GEMINI_API_KEY }) : new ModeloSimuladoAdk(),
      instruction: () => cfg.instrucciones,       // como función: así ADK no intenta reemplazar {llaves} del texto
      tools: [...cfg.lista.map((h) => adaptar(h, ctx, cfg.lista)), ...cfg.terminales.map((d) => terminal(d, finales))],
      generateContentConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    });
    const sesiones = new InMemorySessionService();                // una sesión por corrida
    const runner = new Runner({ appName: "agente-ene", agent: agente, sessionService: sesiones });
    const sesion = await sesiones.createSession({ appName: "agente-ene", userId: "agente" });
    const inicio = new Map<string, number>();

    // Como en bucle.ts: si el modelo habla sin entregar, recibe un empujón, y si insiste se cierra con su texto.
    const mensajes = [cfg.encargo, `Para terminar debes llamar a una de estas herramientas: ${[...nombresTerminales].join(", ")}.`];
    for (const mensaje of mensajes) {
      const eventos = runner.runAsync({
        userId: "agente", sessionId: sesion.id,
        newMessage: { role: "user", parts: [{ text: mensaje }] },
        runConfig: { maxLlmCalls: cfg.maxPasos },
      });
      for await (const ev of eventos) {
        if (ev.errorCode || ev.errorMessage) throw new Error(`${ev.errorCode ?? ""} ${ev.errorMessage ?? ""}`.trim());
        if (ev.partial) continue;
        if (ev.modelVersion && env.GEMINI_API_KEY) modeloUsado = ev.modelVersion;
        tokens += ev.usageMetadata?.totalTokenCount ?? 0;

        // La traza se arma con lo que va pasando: texto del modelo, herramientas pedidas y sus resultados.
        const textos = (ev.content?.parts ?? []).filter((p) => p.text && !p.thought).map((p) => p.text).join(" ").trim();
        if (textos && ev.author !== "user") {
          textoLibre = textos;
          traza.push({ n: traza.length + 1, tipo: "modelo", detalle: textos.slice(0, 600), ms: Date.now() - t0 });
        }
        for (const ll of getFunctionCalls(ev)) {
          const nombre = ll.name ?? "?";
          if (nombresTerminales.has(nombre)) {
            traza.push({ n: traza.length + 1, tipo: "fin", detalle: `El modelo entregó con ${nombre}.`, ms: Date.now() - t0 });
          } else {
            traza.push({ n: traza.length + 1, tipo: "herramienta", detalle: `El modelo pidió ${nombre}(${JSON.stringify(ll.args ?? {})})`, ms: Date.now() - t0 });
            inicio.set(ll.id ?? nombre, Date.now());
          }
        }
        for (const rr of getFunctionResponses(ev)) {
          const nombre = rr.name ?? "?";
          if (nombresTerminales.has(nombre)) continue;
          const ms = Date.now() - (inicio.get(rr.id ?? nombre) ?? Date.now());
          const r = (rr.response ?? {}) as { resultado?: unknown; error?: string };
          if (r.error !== undefined) traza.push({ n: traza.length + 1, tipo: "error", detalle: `${nombre} falló: ${r.error}`, ms });
          else traza.push({ n: traza.length + 1, tipo: "resultado", detalle: `${nombre} devolvió ${resumen(r.resultado)}`, datos: r.resultado, ms });
        }
        if (finales.size) break;
      }
      const [nombre, args] = [...finales][0] ?? [];
      if (nombre) return { final: { nombre, args: args! }, traza, modelo: modeloUsado, tokens };
    }
    traza.push({ n: traza.length + 1, tipo: "fin", detalle: "El modelo terminó con texto libre, sin herramienta terminal.", ms: Date.now() - t0 });
    return { textoLibre, traza, modelo: modeloUsado, tokens };
  } catch (e) {
    if (isLlmCallsLimitExceededError(e)) {
      traza.push({ n: traza.length + 1, tipo: "fin", detalle: `Se agotaron los ${cfg.maxPasos} pasos permitidos.`, ms: Date.now() - t0 });
      return { traza, modelo: modeloUsado, tokens };
    }
    // Nunca un 500 silencioso: el error queda en la traza y en los problemas del borrador.
    const msg = (e as Error).message ?? String(e);
    traza.push({ n: traza.length + 1, tipo: "error", detalle: `El motor ADK falló: ${msg.slice(0, 500)}`, ms: Date.now() - t0 });
    return { traza, modelo: modeloUsado, tokens, error: msg.slice(0, 300) };
  }
}
