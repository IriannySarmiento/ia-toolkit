// La memoria del agente vive en KV (clave → valor). Sin memoria, cada corrida empezaría de cero
// y el agente publicaría el mismo boletín todos los días.
import type { Borrador, Env, Herramienta } from "../tipos";

const CLAVE_ULTIMO = "ultimo_boletin_visto";
const CLAVE_INDICE = "borradores:indice";
const CLAVE_PUBLICADA = "nota_publicada";

export interface EntradaIndice {
  id: string; creado: string; titulo: string; estado: Borrador["estado"]; motivo: Borrador["motivo"]; boletin?: number; problemas: number;
}

export async function leerUltimoBoletinVisto(env: Env): Promise<number | null> {
  const v = await env.MEMORIA.get(CLAVE_ULTIMO);
  return v ? Number(v) : null;
}

export async function anotarBoletinVisto(env: Env, numero: number): Promise<void> {
  const actual = await leerUltimoBoletinVisto(env);
  if (actual === null || numero > actual) await env.MEMORIA.put(CLAVE_ULTIMO, String(numero));
}

export async function guardarBorrador(env: Env, b: Borrador): Promise<void> {
  await env.MEMORIA.put(`borrador:${b.id}`, JSON.stringify(b));
  const indice = await listarBorradores(env);
  const entrada: EntradaIndice = { id: b.id, creado: b.creado, titulo: b.titulo, estado: b.estado, motivo: b.motivo, boletin: b.boletin, problemas: b.problemas.length };
  const nuevo = [entrada, ...indice.filter((e) => e.id !== b.id)].slice(0, 30);
  await env.MEMORIA.put(CLAVE_INDICE, JSON.stringify(nuevo));
}

export async function listarBorradores(env: Env): Promise<EntradaIndice[]> {
  return (await env.MEMORIA.get<EntradaIndice[]>(CLAVE_INDICE, "json")) ?? [];
}

export async function leerBorrador(env: Env, id: string): Promise<Borrador | null> {
  return env.MEMORIA.get<Borrador>(`borrador:${id}`, "json");
}

export async function publicarNota(env: Env, b: Borrador): Promise<void> {
  await env.MEMORIA.put(CLAVE_PUBLICADA, JSON.stringify(b));
}

export async function leerNotaPublicada(env: Env): Promise<Borrador | null> {
  return env.MEMORIA.get<Borrador>(CLAVE_PUBLICADA, "json");
}

/** Herramienta de solo lectura: el modelo puede preguntar qué recuerda el agente. */
export const herramientaMemoria: Herramienta = {
  nombre: "consultar_memoria",
  descripcion: "Consulta la memoria del agente: último boletín visto, borradores recientes y la nota publicada actualmente. No modifica nada.",
  parametros: { type: "object", properties: {} },
  async ejecutar(_args, ctx) {
    const [ultimo, indice, publicada] = await Promise.all([
      leerUltimoBoletinVisto(ctx.env), listarBorradores(ctx.env), leerNotaPublicada(ctx.env),
    ]);
    return {
      ultimoBoletinVisto: ultimo,
      borradoresRecientes: indice.slice(0, 5),
      notaPublicada: publicada ? { id: publicada.id, titulo: publicada.titulo, boletin: publicada.boletin, aprobadoEn: publicada.aprobadoEn } : null,
    };
  },
};
