// EL BUCLE. Esto es lo que convierte un modelo en un agente:
//   1. el modelo lee el objetivo, el procedimiento y el encargo;
//   2. decide: pide una herramienta o termina;
//   3. el programa ejecuta la herramienta y pone el resultado en el contexto;
//   4. vuelve al paso 2, hasta que el modelo entrega el resultado o se acaban los pasos.
// El humano no está dentro del bucle: lo dispara (botón o cron) y revisa el resultado después.
import objetivo from "./objetivo.md";
import procedimiento from "./skills/respuesta-ene.md";
import type { Borrador, Cifra, Env, Herramienta, PasoTraza } from "../tipos";
import { declaraciones, ejecutarHerramienta, herramientas } from "../herramientas";
import { anotarBoletinVisto, guardarBorrador, leerUltimoBoletinVisto } from "../herramientas/memoria";
import { revisarLimites } from "./limites";
import { llamarModelo, esLlamada, esTexto, type Contenido, type Declaracion } from "./modelo";

/* ───────── Herramientas terminales: con ellas el modelo "entrega". Las define el bucle, no el registro. ───────── */
const ENTREGAR: Declaracion = {
  name: "entregar_borrador",
  description: "Entrega el borrador terminado para revisión humana. Llámala una sola vez, al final, con todos los campos.",
  parameters: {
    type: "object",
    properties: {
      titulo: { type: "string", description: "Titular informativo, máximo 12 palabras." },
      bajada: { type: "string", description: "Una frase con la cifra principal y el período." },
      cuerpo: { type: "string", description: "Hasta 180 palabras, en español neutro." },
      cifras: { type: "array", description: "Cada cifra usada, con su fuente.", items: { type: "object", properties: {
        nombre: { type: "string" }, valor: { type: "string" }, variacion: { type: "string" }, fuente: { type: "string" } }, required: ["nombre", "valor", "fuente"] } },
      fuentes: { type: "array", description: "Fuentes completas: boletín, institución, fecha.", items: { type: "string" } },
    },
    required: ["titulo", "bajada", "cuerpo", "cifras", "fuentes"],
  },
};
const SIN_NOVEDAD: Declaracion = {
  name: "terminar_sin_novedad",
  description: "Termina la corrida porque no hay boletín nuevo y no se pidió forzar.",
  parameters: { type: "object", properties: { motivo: { type: "string" } }, required: ["motivo"] },
};
const RESPONDER: Declaracion = {
  name: "responder",
  description: "Entrega la respuesta final a la pregunta del lector, con sus fuentes.",
  parameters: { type: "object", properties: {
    respuesta: { type: "string", description: "Máximo 120 palabras. Si no consta, decirlo." },
    fuentes: { type: "array", items: { type: "string" } } }, required: ["respuesta", "fuentes"] },
};

export interface OpcionesCorrida { motivo: "manual" | "cron"; forzar?: boolean; boletin?: number }

export interface ResultadoBucle {
  final?: { nombre: string; args: Record<string, unknown> };   // la herramienta terminal que cerró la corrida
  textoLibre?: string;                                         // si el modelo terminó hablando en vez de entregar
  traza: PasoTraza[];
  modelo: string;
  tokens: number;
}

/** Corre el bucle genérico. Lo usan tanto la corrida del agente como las preguntas de los lectores. */
export async function ejecutarBucle(env: Env, cfg: { instrucciones: string; encargo: string; lista: Herramienta[]; terminales: Declaracion[]; maxPasos: number }): Promise<ResultadoBucle> {
  const traza: PasoTraza[] = [];
  const ctx = { env, traza };
  const t0 = Date.now();
  const contenidos: Contenido[] = [{ role: "user", parts: [{ text: cfg.encargo }] }];
  const decl = [...declaraciones(cfg.lista), ...cfg.terminales];
  const nombresTerminales = new Set(cfg.terminales.map((d) => d.name));
  traza.push({ n: 1, tipo: "encargo", detalle: cfg.encargo });
  let modeloUsado = "?";
  let tokens = 0;
  let empujones = 0;

  for (let paso = 1; paso <= cfg.maxPasos; paso++) {
    const r = await llamarModelo(env, { instrucciones: cfg.instrucciones, contenidos: contenidos, herramientas: decl });
    modeloUsado = r.modelo;
    tokens += r.tokens?.total ?? 0;
    contenidos.push(r.contenido);                      // se guarda tal cual (incluye firmas de razonamiento si las hay)

    const llamadas = r.contenido.parts.filter(esLlamada);
    const textos = r.contenido.parts.filter(esTexto).map((p) => p.text).join(" ").trim();
    if (textos) traza.push({ n: traza.length + 1, tipo: "modelo", detalle: textos.slice(0, 600), ms: Date.now() - t0 });

    if (llamadas.length === 0) {
      // Habló pero no entregó: un empujón, y si insiste, se cierra con su texto.
      if (empujones++ < 1) {
        contenidos.push({ role: "user", parts: [{ text: `Para terminar debes llamar a una de estas herramientas: ${[...nombresTerminales].join(", ")}.` }] });
        continue;
      }
      traza.push({ n: traza.length + 1, tipo: "fin", detalle: "El modelo terminó con texto libre, sin herramienta terminal.", ms: Date.now() - t0 });
      return { textoLibre: textos, traza, modelo: modeloUsado, tokens };
    }

    const respuestas: Contenido = { role: "user", parts: [] };
    for (const ll of llamadas) {
      const nombre = ll.functionCall.name;
      const args = ll.functionCall.args ?? {};
      if (nombresTerminales.has(nombre)) {
        traza.push({ n: traza.length + 1, tipo: "fin", detalle: `El modelo entregó con ${nombre}.`, ms: Date.now() - t0 });
        return { final: { nombre, args }, traza, modelo: modeloUsado, tokens };
      }
      traza.push({ n: traza.length + 1, tipo: "herramienta", detalle: `El modelo pidió ${nombre}(${JSON.stringify(args)})`, ms: Date.now() - t0 });
      const ti = Date.now();
      try {
        const resultado = await ejecutarHerramienta(nombre, args, ctx, cfg.lista);
        traza.push({ n: traza.length + 1, tipo: "resultado", detalle: `${nombre} devolvió ${resumen(resultado)}`, datos: recortar(resultado), ms: Date.now() - ti });
        respuestas.parts.push({ functionResponse: { name: nombre, response: { resultado: recortar(resultado) } } });
      } catch (e) {
        const msg = (e as Error).message;
        traza.push({ n: traza.length + 1, tipo: "error", detalle: `${nombre} falló: ${msg}`, ms: Date.now() - ti });
        respuestas.parts.push({ functionResponse: { name: nombre, response: { error: msg } } });
      }
    }
    contenidos.push(respuestas);
  }
  traza.push({ n: traza.length + 1, tipo: "fin", detalle: `Se agotaron los ${cfg.maxPasos} pasos permitidos.`, ms: Date.now() - t0 });
  return { traza, modelo: modeloUsado, tokens };
}

/** La corrida del agente: vigila el INE y, si corresponde, redacta y guarda un borrador. */
export async function correrAgente(env: Env, op: OpcionesCorrida): Promise<Borrador | { sinNovedad: true; motivo: string; traza: PasoTraza[]; modelo: string }> {
  const visto = await leerUltimoBoletinVisto(env);
  const hoy = new Date().toLocaleDateString("es-CL", { timeZone: "America/Santiago", year: "numeric", month: "long", day: "numeric" });
  const encargo = [
    `Hoy es ${hoy}. Corrida disparada por: ${op.motivo === "cron" ? "el disparador automático (cron)" : "una persona (botón)"}.`,
    `Último boletín visto según la memoria: ${visto ?? "ninguno"}.`,
    op.boletin ? `Se te pide trabajar específicamente con el boletín ${op.boletin} (usa obtener_boletin).` : "Averigua cuál es el último boletín disponible.",
    op.forzar ? "Se te pide FORZAR la corrida: redacta el borrador aunque el boletín ya haya sido visto." : "Si no hay boletín nuevo, termina sin novedad.",
    "Sigue el procedimiento y entrega con entregar_borrador.",
  ].join("\n");

  const r = await ejecutarBucle(env, {
    instrucciones: `${objetivo}\n\n${procedimiento}`,
    encargo,
    lista: herramientas,
    terminales: [ENTREGAR, SIN_NOVEDAD],
    maxPasos: Number(env.MAX_PASOS ?? 8),
  });

  if (r.final?.nombre === "terminar_sin_novedad") {
    return { sinNovedad: true, motivo: String(r.final.args.motivo ?? ""), traza: r.traza, modelo: r.modelo };
  }

  const a = r.final?.args ?? {};
  const cifras = Array.isArray(a.cifras) ? (a.cifras as Cifra[]).map((c) => ({ nombre: String(c.nombre ?? ""), valor: String(c.valor ?? ""), variacion: c.variacion ? String(c.variacion) : undefined, fuente: String(c.fuente ?? "") })) : [];
  const borrador: Borrador = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    estado: "pendiente",
    creado: new Date().toISOString(),
    motivo: op.motivo,
    boletin: numeroBoletinDesde(r.traza) ?? op.boletin,
    titulo: String(a.titulo ?? (r.textoLibre ? "Sin titular: el modelo respondió en texto libre" : "Sin titular: la corrida no entregó borrador")),
    bajada: String(a.bajada ?? ""),
    cuerpo: String(a.cuerpo ?? r.textoLibre ?? ""),
    cifras,
    fuentes: Array.isArray(a.fuentes) ? (a.fuentes as unknown[]).map(String) : [],
    problemas: [],
    modelo: r.modelo,
    traza: r.traza,
  };
  borrador.problemas = revisarLimites(borrador);
  if (!r.final) borrador.problemas.unshift("La corrida terminó sin entregar un borrador con la herramienta correspondiente.");
  borrador.traza.push({ n: borrador.traza.length + 1, tipo: "limite", detalle: borrador.problemas.length ? `Los límites encontraron ${borrador.problemas.length} problema(s).` : "Los límites no encontraron problemas." });
  await guardarBorrador(env, borrador);
  if (borrador.boletin) await anotarBoletinVisto(env, borrador.boletin);
  return borrador;
}

/** Responde una pregunta de un lector usando el corpus (con RAG local o AI Search) y la memoria. */
export async function responderPregunta(env: Env, pregunta: string) {
  const lista = herramientas.filter((h) => h.nombre === "buscar_en_boletines" || h.nombre === "consultar_memoria");
  const r = await ejecutarBucle(env, {
    instrucciones: `${objetivo}\n\n# Modo pregunta\nAhora no redactas una nota: respondes la pregunta de un lector usando SOLO lo que devuelva buscar_en_boletines. Cita la fuente de cada cifra. Si no consta, dilo y explica qué sí se puede saber. Máximo 120 palabras. Entrega con la herramienta responder.`,
    encargo: pregunta,
    lista,
    terminales: [RESPONDER],
    maxPasos: 5,
  });
  const a = r.final?.args ?? {};
  return {
    pregunta,
    respuesta: String(a.respuesta ?? r.textoLibre ?? "No pude responder en los pasos permitidos."),
    fuentes: Array.isArray(a.fuentes) ? (a.fuentes as unknown[]).map(String) : [],
    modelo: r.modelo,
    traza: r.traza,
  };
}

/* ───────── utilidades ───────── */
function numeroBoletinDesde(traza: PasoTraza[]): number | undefined {
  for (const p of [...traza].reverse()) {
    const d = p.datos as { numero?: number } | undefined;
    if (p.tipo === "resultado" && d && typeof d.numero === "number") return d.numero;
  }
  return undefined;
}

function recortar(v: unknown): unknown {
  // Los textos largos (el boletín entero) se recortan en la traza y en lo que vuelve al modelo.
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = { ...(v as Record<string, unknown>) };
    if (typeof o.texto === "string" && o.texto.length > 9000) o.texto = o.texto.slice(0, 9000) + " […recortado]";
    return o;
  }
  return v;
}

function resumen(v: unknown): string {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("numero" in o) return `el boletín ${o.numero} (${o.origen ?? ""}; tasa ${o.tasa ?? "no extraída"})`;
    if (Array.isArray(v)) return `${v.length} elemento(s)`;
    return `un objeto con ${Object.keys(o).length} campo(s)`;
  }
  return String(v).slice(0, 80);
}
