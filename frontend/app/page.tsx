"use client";
// La portada: la nota publicada. Si no hay ninguna, invita a correr el agente y muestra lo que hizo.
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, API, API_CONFIGURADA, type Borrador, type Paso } from "@/lib/api";
import { Nota } from "@/components/Nota";
import { Traza } from "@/components/Traza";

type Estado = { fase: "cargando" } | { fase: "con-nota"; nota: Borrador } | { fase: "sin-nota"; mensaje: string } | { fase: "error"; mensaje: string };

export default function Portada() {
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [corriendo, setCorriendo] = useState(false);
  const [resultado, setResultado] = useState<{ texto: string; traza?: Paso[]; id?: string; tipo: "ok" | "gris" | "error" } | null>(null);

  async function cargar() {
    try {
      const r = await api.nota();
      if (r.ok) setEstado({ fase: "con-nota", nota: r.datos as Borrador });
      else setEstado({ fase: "sin-nota", mensaje: (r.datos as { mensaje?: string }).mensaje ?? "Todavía no hay una nota publicada." });
    } catch {
      setEstado({
        fase: "error",
        mensaje: API_CONFIGURADA
          ? `No pude hablar con el backend en ${API}. Abre esa dirección en otra pestaña: si no responde, revisa el despliegue en Cloudflare; si responde, revisa que NEXT_PUBLIC_API_URL sea exactamente esa URL, sin barra final.`
          : "Falta la variable NEXT_PUBLIC_API_URL: el frontend no sabe dónde vive su backend. En Vercel: tu proyecto → Settings → Environment Variables → agrega NEXT_PUBLIC_API_URL con la URL de tu Worker (https://ia-toolkit.<tu-subdominio>.workers.dev, sin barra final), marca Production y Preview, guarda y luego Deployments → ⋯ → Redeploy.",
      });
    }
  }
  useEffect(() => { cargar(); }, []);

  async function correr(forzar = false) {
    setCorriendo(true);
    setResultado(null);
    try {
      const r = await api.correr({ forzar });
      const d = r.datos as Record<string, unknown>;
      if (!r.ok) setResultado({ texto: String(d.error ?? `Error ${r.status}`), tipo: "error" });
      else if (d.sinNovedad) setResultado({ texto: `El agente terminó sin novedad: ${d.motivo}`, traza: d.traza as Paso[], tipo: "gris" });
      else setResultado({ texto: `El agente dejó un borrador pendiente de aprobación: “${d.titulo}”.`, traza: d.traza as Paso[], id: String(d.id), tipo: "ok" });
    } catch (e) {
      setResultado({ texto: `No pude correr el agente: ${(e as Error).message}`, tipo: "error" });
    } finally {
      setCorriendo(false);
    }
  }

  return (
    <>
      {estado.fase === "cargando" && <p className="meta">Cargando…</p>}
      {estado.fase === "error" && <div className="aviso">{estado.mensaje}</div>}
      {estado.fase === "con-nota" && <Nota nota={estado.nota} conTraza={false} />}
      {estado.fase === "sin-nota" && (
        <>
          <p className="kicker">Sin nota publicada</p>
          <h1 className="titular">El agente todavía no tiene una nota aprobada.</h1>
          <p className="bajada">{estado.mensaje} Puedes pedirle que corra ahora: revisará si hay un boletín nuevo del INE y dejará un borrador.</p>
        </>
      )}

      <div className="caja">
        <h3>Correr el agente</h3>
        <div className="fila">
          <button className="boton" disabled={corriendo} onClick={() => correr(false)}>{corriendo ? "El agente está trabajando…" : "Revisar si hay boletín nuevo"}</button>
          <button className="boton secundario" disabled={corriendo} onClick={() => correr(true)}>Forzar una corrida</button>
          <Link href="/borradores">Ver borradores →</Link>
        </div>
        {resultado && (
          <div className={`aviso ${resultado.tipo === "ok" ? "ok" : resultado.tipo === "gris" ? "gris" : ""}`}>
            {resultado.texto} {resultado.id && <Link href={`/borradores?id=${resultado.id}`}>Abrir el borrador →</Link>}
            {resultado.traza && <Traza pasos={resultado.traza} abierta />}
          </div>
        )}
      </div>
    </>
  );
}
