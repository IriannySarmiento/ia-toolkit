// PLANTILLA para una herramienta nueva. Copiar este archivo con otro nombre, completar los cuatro
// campos y registrar la herramienta en index.ts (lista `herramientas`). Nada más.
//
// Qué es una herramienta: una función con nombre y descripción que el MODELO puede pedir y el PROGRAMA
// ejecuta. El modelo elige cuándo usarla leyendo la descripción; por eso la descripción importa tanto
// como el código.
import type { Herramienta } from "../tipos";

export const herramientaEjemplo: Herramienta = {
  // 1. Nombre en minúsculas, con guiones bajos. Es lo que el modelo escribe cuando la pide.
  nombre: "nombre_de_la_herramienta",

  // 2. Descripción: para qué sirve y cuándo usarla. Frases completas, sin tecnicismos.
  descripcion: "Explica aquí qué hace y en qué situación el agente debería usarla.",

  // 3. Parámetros: qué datos necesita, en JSON Schema. Cada uno con su descripción.
  parametros: {
    type: "object",
    properties: {
      ejemplo: { type: "string", description: "Qué significa este dato." },
    },
    required: ["ejemplo"],
  },

  // 4. Qué hace. Recibe los argumentos que mandó el modelo y el contexto (env con memoria e IA, traza).
  //    Devuelve cualquier objeto serializable: eso es lo que vuelve al contexto del modelo.
  async ejecutar(args, _ctx) {
    return { recibido: args.ejemplo, mensaje: "Reemplazar por el trabajo real de la herramienta." };
  },
};
