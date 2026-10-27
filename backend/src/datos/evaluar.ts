// EVALUAR (clase 8): ¿qué búsqueda encuentra mejor? Corre el banco de preguntas del curso contra la búsqueda
// por palabras (via=local) o por significado (via=vector) y devuelve, por pregunta, el mejor fragmento y su
// fuente. No llama al modelo que redacta: solo mide la recuperación (cuesta vectores, no tokens de respuesta).
// Para proyectar las dos columnas lado a lado: /evaluar?via=local y /evaluar?via=vector
import banco from "../corpus/banco_preguntas.json";
import type { Env } from "../tipos";
import { buscarLocal } from "../herramientas/corpus";
import { buscarVariosVectores, conectar, contar } from "./neon";
import { vectorizar } from "./embeddings";

interface Pregunta { id: string; pregunta: string; tipo: "texto" | "cifra" | "trampa"; esperado: string; fuente_esperada: string }
const PREGUNTAS = (banco as { preguntas: Pregunta[] }).preguntas;

export async function evaluar(env: Env, via: "local" | "vector", max: number) {
  const t0 = Date.now();
  let resultados: Array<Array<{ texto: string; fuente: string; puntaje: number }>>;
  if (via === "vector") {
    const sql = conectar(env);
    if (!sql) return { ok: false, error: "Sin DATABASE_URL no hay búsqueda por significado. Prueba /evaluar?via=local." };
    if ((await contar(sql)).trozos === 0) return { ok: false, error: "El índice de Neon está vacío: abre /indexar primero." };
    const vectores = await vectorizar(PREGUNTAS.map((p) => p.pregunta), env, "RETRIEVAL_QUERY");
    resultados = await buscarVariosVectores(sql, vectores, max);
  } else {
    resultados = PREGUNTAS.map((p) => buscarLocal(p.pregunta, max));
  }
  return {
    ok: true,
    via,
    explicacion: via === "vector"
      ? "Búsqueda por significado: la pregunta y cada trozo se convierten en vectores y se comparan (puntaje 0 a 1)."
      : "Búsqueda por palabras: cuenta qué palabras de la pregunta aparecen en cada trozo (puntaje sin techo).",
    preguntas: PREGUNTAS.map((p, i) => ({
      id: p.id,
      tipo: p.tipo,
      pregunta: p.pregunta,
      esperado: p.esperado,
      fuente_esperada: p.fuente_esperada,
      encontrado: resultados[i].map((h) => ({ fragmento: h.texto.slice(0, 280), fuente: h.fuente, puntaje: h.puntaje })),
    })),
    segundos: Number(((Date.now() - t0) / 1000).toFixed(1)),
  };
}
