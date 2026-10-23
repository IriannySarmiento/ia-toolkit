"use client";
// La mesa de edición: aquí una persona aprueba o rechaza lo que escribió el agente. Humano en el bucle.
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, fecha, type Borrador, type EntradaIndice } from "@/lib/api";
import { Nota } from "@/components/Nota";

function Mesa() {
  const params = useSearchParams();
  const [lista, setLista] = useState<EntradaIndice[]>([]);
  const [abierto, setAbierto] = useState<Borrador | null>(null);
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function cargarLista() {
    const r = await api.borradores();
    if (r.ok) setLista(r.datos);
  }
  async function abrir(id: string) {
    const r = await api.borrador(id);
    if (r.ok) { setAbierto(r.datos); setMensaje(null); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  useEffect(() => {
    cargarLista();
    try { setNombre(sessionStorage.getItem("editor") ?? ""); setClave(sessionStorage.getItem("clave") ?? ""); } catch {}
    const id = params.get("id");
    if (id) abrir(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decidir(accion: "aprobar" | "rechazar") {
    if (!abierto) return;
    setOcupado(true);
    try { sessionStorage.setItem("editor", nombre); sessionStorage.setItem("clave", clave); } catch {}
    const r = await api.decidir(accion, abierto.id, nombre, clave);
    setOcupado(false);
    if (r.ok) {
      setMensaje({ texto: accion === "aprobar" ? "Aprobado y publicado. Ya está en la portada." : "Rechazado. No se publica.", ok: true });
      await cargarLista();
      await abrir(abierto.id);
    } else {
      setMensaje({ texto: r.datos.error ?? `Error ${r.status}`, ok: false });
    }
  }

  return (
    <>
      {abierto ? (
        <>
          <Nota nota={abierto} kicker={`Borrador · ${abierto.estado}`} />
          <div className="caja">
            <h3>Decisión editorial</h3>
            <label>Tu nombre (queda registrado como responsable)</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" />
            <label>Clave de aprobación del equipo</label>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="La clave que configuró el equipo" />
            <div className="fila" style={{ marginTop: 12 }}>
              <button className="boton" disabled={ocupado || abierto.estado === "aprobado"} onClick={() => decidir("aprobar")}>Aprobar y publicar</button>
              <button className="boton secundario" disabled={ocupado} onClick={() => decidir("rechazar")}>Rechazar</button>
              <button className="boton secundario" onClick={() => setAbierto(null)}>Volver a la lista</button>
            </div>
            {mensaje && <div className={`aviso ${mensaje.ok ? "ok" : ""}`}>{mensaje.texto}</div>}
          </div>
        </>
      ) : (
        <>
          <p className="kicker">Mesa de edición</p>
          <h1 className="titular">Borradores del agente</h1>
          <p className="bajada">Nada se publica sin que una persona lo apruebe. Abre un borrador, lee la traza, decide.</p>
          {lista.length === 0 && <div className="aviso gris">Todavía no hay borradores. Corre el agente desde la portada.</div>}
          <ul className="lista">
            {lista.map((e) => (
              <li key={e.id}>
                <div>
                  <a href="#" onClick={(ev) => { ev.preventDefault(); abrir(e.id); }}><strong>{e.titulo}</strong></a>
                  <div className="meta" style={{ margin: 0 }}>{fecha(e.creado)} · {e.motivo}{e.boletin ? ` · boletín ${e.boletin}` : ""}{e.problemas ? ` · ${e.problemas} problema(s)` : ""}</div>
                </div>
                <span className={`etiqueta ${e.estado}`}>{e.estado}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function Pagina() {
  return (
    <Suspense fallback={<p className="meta">Cargando…</p>}>
      <Mesa />
    </Suspense>
  );
}
