"use client";
// Transparencia: qué es este agente, qué puede hacer, qué revisa un humano. En la clase 10 este texto
// se convierte en la declaración de uso de IA completa. Lo que está entre corchetes lo escribe el equipo.
import { useEffect, useState } from "react";
import { api, API, type Inventario } from "@/lib/api";
import { marca } from "@/lib/marca";

export default function Transparencia() {
  const [inv, setInv] = useState<Inventario | null>(null);
  useEffect(() => { api.inventario().then((r) => r.ok && setInv(r.datos)).catch(() => {}); }, []);

  return (
    <>
      <p className="kicker">Transparencia</p>
      <h1 className="titular">Cómo funciona {marca.nombre}</h1>
      <p className="bajada">{marca.declaracionCorta}</p>

      <div className="cuerpo">
        <p><strong>Qué hace el agente.</strong> Revisa si el INE publicó un boletín nuevo de la Encuesta Nacional de Empleo, lee sus cifras y redacta un borrador de nota siguiendo un procedimiento escrito por el equipo. [El equipo describe aquí, en sus palabras, qué decidió que haga y qué no.]</p>
        <p><strong>Qué revisa una persona.</strong> Ningún borrador se publica sin que un integrante del equipo lo apruebe con su nombre. Antes de aprobar, se comparan las cifras con el boletín original. [Nombres o roles de quienes aprueban.]</p>
        <p><strong>Qué no puede hacer.</strong> No inventa cifras ni causas; si algo no está en los boletines, dice que no consta. No entrega datos por comuna porque la ENE no los produce. [Límites adicionales del equipo.]</p>
        <p><strong>Errores conocidos.</strong> [Lo que falló en las pruebas del equipo y cómo se detecta.]</p>
      </div>

      <div className="caja">
        <h3>Estado del agente (en vivo, desde el backend)</h3>
        {inv ? (
          <>
            <p style={{ margin: "0 0 8px" }}>{inv.nombre} · {inv.equipo} · modelo: <code>{inv.modelo}</code> · último boletín visto: <code>{inv.ultimoBoletinVisto ?? "ninguno"}</code></p>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--gris)" }}>Herramientas que puede pedir:</p>
            <ul className="fuentes">
              {inv.herramientas.map((h) => <li key={h.nombre}><code>{h.nombre}</code> — {h.descripcion}</li>)}
            </ul>
            <p style={{ fontSize: 13, color: "var(--gris)", margin: 0 }}>Backend: <a href={API} target="_blank" rel="noreferrer">{API}</a> · servidor MCP en <code>{API}/mcp</code></p>
          </>
        ) : (
          <p className="meta">Consultando el backend…</p>
        )}
      </div>
    </>
  );
}
