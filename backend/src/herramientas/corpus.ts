// El corpus: los boletines que el agente puede consultar para responder preguntas.
// Clase 7: búsqueda por palabras sobre un corpus local (la "búsqueda por palabras" de la clase 6).
// Clase 8: si existe el binding CORPUS (AI Search), la búsqueda pasa a ser semántica y en producción.
import type { Herramienta, ContextoHerramienta } from "../tipos";
import documentos from "../corpus/boletines.json";

interface Documento { id: string; numero: number | null; titulo: string; fuente: string; fecha: string; url: string; origen: string; texto: string }
interface Trozo { texto: string; fuente: string; url: string; id: string }
export interface Hallazgo { texto: string; fuente: string; puntaje: number; url?: string; via: "AI Search" | "corpus local" }

const DOCS = documentos as Documento[];

export function ultimoNumeroLocal(): number {
  return Math.max(...DOCS.map((d) => d.numero ?? 0));
}

export function boletinLocal(numero: number): Documento | undefined {
  return DOCS.find((d) => d.numero === numero);
}

/** Trocea cada documento en fragmentos de ~700 caracteres cortando en puntos (como en la clase 6). */
function trozos(): Trozo[] {
  const out: Trozo[] = [];
  for (const d of DOCS) {
    const frases = d.texto.split(/(?<=\.)\s+|\n+/);
    let actual = "";
    for (const f of frases) {
      if ((actual + " " + f).length > 700 && actual) {
        out.push({ texto: actual.trim(), fuente: `${d.titulo} (${d.fuente}, ${d.fecha})`, url: d.url, id: d.id });
        actual = "";
      }
      actual += " " + f;
    }
    if (actual.trim()) out.push({ texto: actual.trim(), fuente: `${d.titulo} (${d.fuente}, ${d.fecha})`, url: d.url, id: d.id });
  }
  return out;
}

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const PALABRAS_VACIAS = new Set("de la el los las un una y o en que es por para con del al se su sus como mas fue cual cuanto cuantos cuanta hay".split(" "));

/** Búsqueda por palabras: cuenta coincidencias de términos (con un premio si la palabra es rara). */
export function buscarLocal(consulta: string, max = 5): Hallazgo[] {
  const terminos = normalizar(consulta).split(/[^a-z0-9%,.]+/).filter((t) => t.length > 2 && !PALABRAS_VACIAS.has(t));
  const T = trozos();
  const df = new Map<string, number>();
  for (const t of terminos) df.set(t, T.filter((x) => normalizar(x.texto).includes(t)).length || 1);
  return T.map((x) => {
    const n = normalizar(x.texto);
    let puntaje = 0;
    for (const t of terminos) if (n.includes(t)) puntaje += Math.log(1 + T.length / (df.get(t) ?? 1));
    return { texto: x.texto, fuente: x.fuente, url: x.url, puntaje: Number(puntaje.toFixed(2)), via: "corpus local" as const };
  }).filter((h) => h.puntaje > 0).sort((a, b) => b.puntaje - a.puntaje).slice(0, max);
}

/** Búsqueda semántica con AI Search (clase 8). Devuelve la misma forma que la local. */
export async function buscarEnAISearch(consulta: string, ctx: ContextoHerramienta, max = 5): Promise<Hallazgo[]> {
  const instancia = ctx.env.CORPUS!.get("boletines-ene");
  const r = await instancia.search({ query: consulta, ai_search_options: { retrieval: { max_num_results: max } } });
  return r.chunks.map((c) => ({ texto: c.text, fuente: c.item?.key ?? "documento del índice", puntaje: Number(c.score.toFixed(2)), via: "AI Search" as const }));
}

export async function buscarEnBoletines(consulta: string, ctx: ContextoHerramienta, max = 5): Promise<Hallazgo[]> {
  if (ctx.env.CORPUS) {
    try { return await buscarEnAISearch(consulta, ctx, max); } catch (e) {
      ctx.traza.push({ n: ctx.traza.length + 1, tipo: "error", detalle: `AI Search falló (${(e as Error).message}); usé el corpus local.` });
    }
  }
  return buscarLocal(consulta, max);
}

export const herramientaBuscar: Herramienta = {
  nombre: "buscar_en_boletines",
  descripcion: "Busca fragmentos relevantes en los boletines ENE y el glosario del curso a partir de una consulta en lenguaje natural. Devuelve fragmentos con su fuente. Úsala para responder preguntas o para comparar con boletines anteriores.",
  parametros: {
    type: "object",
    properties: {
      consulta: { type: "string", description: "Qué se busca, por ejemplo: tasa de desocupación femenina junio-agosto 2026." },
      max: { type: "integer", description: "Cuántos fragmentos devolver (1 a 8). Por defecto 5." },
    },
    required: ["consulta"],
  },
  async ejecutar(args, ctx) {
    const max = Math.min(Math.max(Number(args.max) || 5, 1), 8);
    return buscarEnBoletines(String(args.consulta ?? ""), ctx, max);
  },
};
