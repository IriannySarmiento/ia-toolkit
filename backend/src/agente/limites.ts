// Límites (guardrails) de salida: reglas que el PROGRAMA revisa después de que el modelo escribe.
// El modelo puede equivocarse; estas reglas no. En la clase 9 este archivo crece.
import type { Borrador } from "../tipos";

/** Devuelve la lista de problemas encontrados. Lista vacía = el borrador pasa. */
export function revisarLimites(b: Pick<Borrador, "titulo" | "bajada" | "cuerpo" | "cifras" | "fuentes">): string[] {
  const problemas: string[] = [];

  // 1. Toda cifra declarada debe traer fuente.
  for (const c of b.cifras) {
    if (!c.fuente || c.fuente.trim().length < 8) problemas.push(`La cifra "${c.nombre}" no tiene fuente.`);
  }

  // 2. Si el cuerpo trae porcentajes, debe haber al menos una fuente en la lista.
  if (/\d+,\d+\s?%/.test(b.cuerpo) && b.fuentes.length === 0) problemas.push("El cuerpo cita porcentajes y no hay fuentes.");

  // 3. Variaciones de tasas en puntos porcentuales, no en "%" (regla de la clase 6).
  if (/(subi|baj|aument|disminu)[a-zó]*\s+\d+,\d+\s?%/i.test(b.cuerpo) && !/pp\.?/.test(b.cuerpo)) {
    problemas.push("Parece haber una variación de tasa expresada en % en vez de puntos porcentuales (pp.).");
  }

  // 4. Nada por comuna: la ENE no lo permite.
  if (/\bcomuna\b/i.test(b.cuerpo) && !/no (consta|permite|entrega)/i.test(b.cuerpo)) {
    problemas.push("Menciona una comuna sin aclarar que la ENE no entrega cifras comunales.");
  }

  // 5. Adjetivos valorativos.
  const valorativos = /\b(alarmante|histórico|histórica|preocupante|dramático|dramática|catastrófico)\b/i;
  if (valorativos.test(b.titulo + " " + b.bajada + " " + b.cuerpo)) problemas.push("Hay adjetivos valorativos.");

  // 6. Largo.
  const palabras = b.cuerpo.trim().split(/\s+/).length;
  if (palabras > 220) problemas.push(`El cuerpo tiene ${palabras} palabras; el máximo es 180.`);

  return problemas;
}
