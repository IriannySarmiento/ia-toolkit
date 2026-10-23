import type { Paso } from "@/lib/api";

/** La traza: la bitácora paso a paso de una corrida. Leerla es entender qué hizo el agente. */
export function Traza({ pasos, abierta = false }: { pasos: Paso[]; abierta?: boolean }) {
  if (!pasos?.length) return null;
  return (
    <details open={abierta}>
      <summary>Ver la traza del agente ({pasos.length} pasos)</summary>
      <ol className="traza">
        {pasos.map((p) => (
          <li key={p.n}>
            <span className="n">{p.n}</span>
            <span className={`tipo ${p.tipo}`}>{p.tipo}</span>
            <span className="detalle">
              {p.detalle}
              {typeof p.ms === "number" && <span className="ms">{p.ms} ms</span>}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
