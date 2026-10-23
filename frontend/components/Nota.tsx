import type { Borrador } from "@/lib/api";
import { fecha } from "@/lib/api";
import { Traza } from "./Traza";

/** Cómo se muestra una nota (publicada o borrador): titular, bajada, cuerpo, cifras con fuente, fuentes. */
export function Nota({ nota, kicker, conTraza = true }: { nota: Borrador; kicker?: string; conTraza?: boolean }) {
  return (
    <article>
      <p className="kicker">{kicker ?? (nota.boletin ? `Boletín ENE n.º ${nota.boletin}` : "Empleo")}</p>
      <h1 className="titular">{nota.titulo}</h1>
      {nota.bajada && <p className="bajada">{nota.bajada}</p>}
      <p className="meta">
        {nota.estado === "aprobado" ? `Aprobada por ${nota.aprobadoPor ?? "el equipo"} · ${fecha(nota.aprobadoEn)}` : `Borrador ${nota.estado} · creado ${fecha(nota.creado)}`}
        {" · "}redactado por el agente ({nota.modelo}) · disparo: {nota.motivo}
      </p>
      <div className="cuerpo">
        {nota.cuerpo.split(/\n{2,}/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {nota.cifras?.length > 0 && (
        <div className="caja">
          <h3>Las cifras y de dónde salen</h3>
          <div className="cifras">
            {nota.cifras.map((c, i) => (
              <div className="cifra" key={i}>
                <div className="valor">{c.valor}</div>
                <div className="nombre">{c.nombre}</div>
                {c.variacion && <div className="variacion">{c.variacion}</div>}
                <div className="fuente">{c.fuente}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {nota.fuentes?.length > 0 && (
        <div className="caja">
          <h3>Fuentes</h3>
          <ul className="fuentes">
            {nota.fuentes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {nota.problemas?.length > 0 && (
        <div className="aviso">
          <strong>Los límites detectaron problemas:</strong>
          <ul className="problemas">
            {nota.problemas.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {conTraza && <Traza pasos={nota.traza} />}
    </article>
  );
}
