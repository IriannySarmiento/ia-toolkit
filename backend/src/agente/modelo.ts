// El modelo: la única pieza que "piensa". Aquí se le habla a Gemini por su API (petición → respuesta).
// Si no hay clave, se usa un modelo SIMULADO que sigue un guion fijo: sirve para probar el bucle y
// el despliegue sin gastar nada. La traza siempre dice cuál de los dos se usó.
import type { Env } from "../tipos";

export interface ParteTexto { text: string; thoughtSignature?: string }
export interface ParteLlamada { functionCall: { name: string; args?: Record<string, unknown> }; thoughtSignature?: string }
export interface ParteRespuesta { functionResponse: { name: string; response: Record<string, unknown> } }
export type Parte = ParteTexto | ParteLlamada | ParteRespuesta;
export interface Contenido { role: "user" | "model"; parts: Parte[] }
export interface Declaracion { name: string; description: string; parameters: unknown }

export interface Peticion {
  instrucciones: string;        // systemInstruction: la capa permanente (objetivo + procedimiento)
  contenidos: Contenido[];      // el historial de la corrida: encargo, llamadas, resultados
  herramientas: Declaracion[];  // qué puede pedir
}

export interface Respuesta { contenido: Contenido; modelo: string; tokens?: { entrada?: number; salida?: number; total?: number } }

export const esLlamada = (p: Parte): p is ParteLlamada => "functionCall" in p;
export const esTexto = (p: Parte): p is ParteTexto => "text" in p;

export async function llamarModelo(env: Env, p: Peticion): Promise<Respuesta> {
  if (!env.GEMINI_API_KEY) return modeloSimulado(p);
  const modelos = (env.GEMINI_MODELOS ?? "gemini-3.6-flash,gemini-3.5-flash,gemini-flash-latest").split(",").map((s) => s.trim()).filter(Boolean);
  let ultimoError = "";
  for (const modelo of modelos) {
    for (let intento = 0; intento < 2; intento++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: p.instrucciones }] },
          contents: p.contenidos,
          tools: [{ functionDeclarations: p.herramientas }],
          toolConfig: { functionCallingConfig: { mode: "AUTO" } },
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (r.ok) {
        const j = (await r.json()) as { candidates?: Array<{ content?: Contenido; finishReason?: string }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } };
        const contenido = j.candidates?.[0]?.content;
        if (!contenido || !contenido.parts?.length) throw new Error(`El modelo ${modelo} respondió sin contenido (finishReason: ${j.candidates?.[0]?.finishReason ?? "?"}).`);
        return { contenido: { role: "model", parts: contenido.parts }, modelo, tokens: { entrada: j.usageMetadata?.promptTokenCount, salida: j.usageMetadata?.candidatesTokenCount, total: j.usageMetadata?.totalTokenCount } };
      }
      const cuerpo = await r.text();
      ultimoError = `${modelo}: HTTP ${r.status} ${cuerpo.slice(0, 300)}`;
      if (r.status === 404 || r.status === 400) break;                 // el modelo no existe o la petición es inválida: probar el siguiente
      if (r.status === 429 || r.status >= 500) { await new Promise((res) => setTimeout(res, 2500)); continue; } // cuota o caída: reintentar una vez
      break;
    }
  }
  throw new Error(`Ningún modelo respondió. Último error: ${ultimoError}`);
}

/** Guion fijo: 1) pide el último boletín; 2) entrega un borrador con lo que recibió. */
function modeloSimulado(p: Peticion): Respuesta {
  const h = p.contenidos;
  const nombres = p.herramientas.map((d) => d.name);
  const respuestas = h.flatMap((c) => c.parts).filter((x): x is ParteRespuesta => "functionResponse" in x);
  const yaBuscoBoletin = respuestas.find((r) => r.functionResponse.name === "obtener_ultimo_boletin");
  const esPregunta = nombres.includes("responder");

  if (esPregunta) {
    const busqueda = respuestas.find((r) => r.functionResponse.name === "buscar_en_boletines");
    if (!busqueda) {
      const pregunta = (h[0]?.parts.find(esTexto) as ParteTexto | undefined)?.text ?? "";
      return { modelo: "simulado", contenido: { role: "model", parts: [{ functionCall: { name: "buscar_en_boletines", args: { consulta: pregunta.slice(0, 200), max: 4 } } }] } };
    }
    const hallazgos = (busqueda.functionResponse.response as { resultado?: Array<{ texto: string; fuente: string }> }).resultado ?? [];
    const primero = hallazgos[0];
    return { modelo: "simulado", contenido: { role: "model", parts: [{ functionCall: { name: "responder", args: {
      respuesta: primero ? `Según las fuentes del curso: ${primero.texto.slice(0, 350)}` : "No consta en los boletines cargados.",
      fuentes: hallazgos.slice(0, 3).map((x) => x.fuente),
    } } }] } };
  }

  const encargo = (h[0]?.parts.find(esTexto) as ParteTexto | undefined)?.text ?? "";
  const pedido = encargo.match(/bolet[ií]n (\d{3}) \(usa obtener_boletin\)/i)?.[1];
  const yaBuscoEspecifico = respuestas.find((r) => r.functionResponse.name === "obtener_boletin");
  if (!yaBuscoBoletin && !yaBuscoEspecifico) {
    const llamada = pedido ? { name: "obtener_boletin", args: { numero: Number(pedido) } } : { name: "obtener_ultimo_boletin", args: {} };
    return { modelo: "simulado", contenido: { role: "model", parts: [{ functionCall: llamada }] } };
  }
  const b = (yaBuscoBoletin ?? yaBuscoEspecifico)!.functionResponse.response.resultado as { numero?: number; tasa?: string; variacionPp?: string; trimestre?: string; fecha?: string; desocupados?: string; esNuevo?: boolean; origen?: string } | undefined;
  const forzar = /forzar/i.test(JSON.stringify(h[0]?.parts ?? []));
  if (b && b.esNuevo === false && !forzar && nombres.includes("terminar_sin_novedad")) {
    return { modelo: "simulado", contenido: { role: "model", parts: [{ functionCall: { name: "terminar_sin_novedad", args: { motivo: `El boletín ${b.numero} ya fue visto.` } } }] } };
  }
  const fuente = `Boletín ENE n.º ${b?.numero ?? "?"}, INE, ${b?.fecha ?? "fecha no extraída"} (${b?.origen ?? "origen no indicado"})`;
  return { modelo: "simulado", contenido: { role: "model", parts: [{ functionCall: { name: "entregar_borrador", args: {
    titulo: `Desocupación llega a ${b?.tasa ?? "(cifra no extraída)"} en el trimestre ${b?.trimestre ?? "(no extraído)"}`,
    bajada: `El INE informó una tasa de desocupación nacional de ${b?.tasa ?? "(no extraída)"}, ${b?.variacionPp ? `${b.variacionPp} pp. más que hace un año` : "con variación no extraída"}.`,
    cuerpo: `[Borrador generado por el modelo SIMULADO: no hay clave de Gemini configurada.] La tasa de desocupación nacional fue ${b?.tasa ?? "(no extraída)"} en el trimestre móvil ${b?.trimestre ?? "(no extraído)"}, según el ${fuente}. ${b?.variacionPp ? `Es ${b.variacionPp} puntos porcentuales más que un año antes.` : ""} ${b?.desocupados ? `El total de personas desocupadas llegó a ${b.desocupados}.` : ""} La ENE no permite conocer la cifra por comuna.`,
    cifras: [
      { nombre: "tasa de desocupación nacional", valor: b?.tasa ?? "no extraída", variacion: b?.variacionPp ? `+${b.variacionPp} pp. en doce meses` : undefined, fuente },
    ],
    fuentes: [fuente],
  } } }] } };
}
