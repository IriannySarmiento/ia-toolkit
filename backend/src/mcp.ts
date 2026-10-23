// El servidor MCP: la "puerta" por la que OTROS agentes (Claude Code, el agente de otro equipo)
// pueden usar las herramientas de este. MCP es un estándar: cualquier cliente compatible se conecta
// a https://<este-worker>/mcp y descubre qué herramientas hay, sin que nadie le explique nada.
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { Env } from "./tipos";
import { buscarEnBoletines } from "./herramientas/corpus";
import { leerNotaPublicada, leerUltimoBoletinVisto, listarBorradores } from "./herramientas/memoria";
import { obtenerBoletin } from "./herramientas/ine";

export function crearServidorMcp(env: Env): McpServer {
  const servidor = new McpServer({ name: `agente-ene-${(env.NOMBRE_EQUIPO ?? "equipo").toLowerCase().replace(/\s+/g, "-")}`, version: "0.1.0" });
  const ctx = { env, traza: [] };

  servidor.registerTool(
    "ultima_tasa",
    {
      title: "Última tasa de desocupación",
      description: "Devuelve la tasa de desocupación nacional del último boletín ENE que conoce este agente, con su fuente.",
      inputSchema: z.object({}),
    },
    async () => {
      const visto = await leerUltimoBoletinVisto(env);
      const publicada = await leerNotaPublicada(env);
      const numero = visto ?? 335;
      const b = await obtenerBoletin(numero, ctx);
      const salida = { boletin: numero, tasa: b.tasa ?? null, variacionPp: b.variacionPp ?? null, trimestre: b.trimestre ?? null, fecha: b.fecha ?? null, fuente: b.url, origen: b.origen, notaPublicada: publicada?.titulo ?? null };
      return { content: [{ type: "text", text: JSON.stringify(salida, null, 2) }], structuredContent: salida };
    },
  );

  servidor.registerTool(
    "buscar_en_boletines",
    {
      title: "Buscar en los boletines ENE",
      description: "Busca fragmentos relevantes en los boletines ENE del INE y el glosario del curso. Devuelve texto con su fuente.",
      inputSchema: z.object({ consulta: z.string().describe("Qué se busca, en lenguaje natural."), max: z.number().int().min(1).max(8).optional() }),
    },
    async ({ consulta, max }) => {
      const hallazgos = await buscarEnBoletines(consulta, ctx, max ?? 5);
      const texto = hallazgos.map((h, i) => `[${i + 1}] (${h.via}, puntaje ${h.puntaje}) ${h.texto}\n    Fuente: ${h.fuente}`).join("\n\n") || "Sin resultados.";
      return { content: [{ type: "text", text: texto }] };
    },
  );

  servidor.registerTool(
    "estado_del_agente",
    {
      title: "Estado del agente",
      description: "Informa qué boletín vio por última vez este agente, sus borradores recientes y la nota publicada.",
      inputSchema: z.object({}),
    },
    async () => {
      const [visto, indice, publicada] = await Promise.all([leerUltimoBoletinVisto(env), listarBorradores(env), leerNotaPublicada(env)]);
      const salida = { equipo: env.NOMBRE_EQUIPO ?? null, ultimoBoletinVisto: visto, borradores: indice.slice(0, 5), notaPublicada: publicada ? { titulo: publicada.titulo, aprobadoEn: publicada.aprobadoEn } : null };
      return { content: [{ type: "text", text: JSON.stringify(salida, null, 2) }], structuredContent: salida };
    },
  );

  return servidor;
}
