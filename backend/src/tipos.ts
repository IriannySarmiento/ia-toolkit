// Tipos compartidos por todo el backend. Leer este archivo es leer el vocabulario del agente.

/** Lo que Cloudflare le entrega al Worker en cada ejecución: memoria, IA, secretos y variables. */
export interface Env {
  MEMORIA: KVNamespace;            // la memoria del agente (clave → valor)
  AI: Ai;                          // Workers AI: convierte el PDF del INE a texto
  CORPUS?: AiSearchBinding;        // clase 8: el RAG gestionado (AI Search). Si no existe, se usa el corpus local
  GEMINI_API_KEY?: string;         // secreto
  CLAVE_APROBACION?: string;       // secreto
  NOMBRE_EQUIPO?: string;
  GEMINI_MODELOS?: string;         // lista separada por comas, en orden de preferencia
  MAX_PASOS?: string;
}

/** Forma mínima del binding de AI Search que usamos (search devuelve trozos con puntaje y origen). */
export interface AiSearchBinding {
  get(nombre: string): {
    search(opciones: {
      query: string;
      ai_search_options?: { retrieval?: { max_num_results?: number } ; query_rewrite?: { enabled?: boolean } };
    }): Promise<{ chunks: Array<{ id: string; score: number; text: string; item?: { key?: string } }> }>;
  };
}

/** Una herramienta: algo que el agente puede pedir que se ejecute. El modelo no la ejecuta; el programa sí. */
export interface Herramienta {
  nombre: string;
  descripcion: string;                               // el modelo decide con esto cuándo usarla
  parametros: EsquemaJson;                           // qué argumentos acepta (JSON Schema)
  ejecutar(args: Record<string, unknown>, ctx: ContextoHerramienta): Promise<unknown>;
}

export interface ContextoHerramienta {
  env: Env;
  traza: PasoTraza[];
}

export interface EsquemaJson {
  type: "object";
  properties: Record<string, { type: string; description?: string; enum?: string[]; items?: { type: string } }>;
  required?: string[];
}

/** Un paso de la traza: la bitácora de lo que el agente pensó, pidió y recibió. */
export interface PasoTraza {
  n: number;
  tipo: "encargo" | "modelo" | "herramienta" | "resultado" | "limite" | "fin" | "error";
  detalle: string;
  datos?: unknown;
  ms?: number;
}

export interface Cifra {
  nombre: string;         // "tasa de desocupación nacional"
  valor: string;          // "9,6%"
  variacion?: string;     // "+1,0 pp. en doce meses"
  fuente: string;         // "Boletín ENE n.º 335, INE, 30-09-2026"
}

export interface Borrador {
  id: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  creado: string;         // ISO
  motivo: "manual" | "cron" | "pregunta";
  boletin?: number;
  titulo: string;
  bajada: string;
  cuerpo: string;
  cifras: Cifra[];
  fuentes: string[];
  problemas: string[];    // lo que detectaron los límites
  modelo: string;
  traza: PasoTraza[];
  aprobadoPor?: string;
  aprobadoEn?: string;
}

export interface ResumenBoletin {
  numero: number;
  url: string;
  fecha?: string;
  trimestre?: string;
  tasa?: string;                 // "9,6%"
  variacionPp?: string;          // "1,0"
  desocupados?: string;
  inactivos?: string;
  texto: string;                 // texto (recortado) del boletín
  origen: "INE en vivo" | "corpus local del curso";
}
