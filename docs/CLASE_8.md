# Clase 8 (30 oct): el agente corre solo, busca en serio y se conecta

Todo lo de esta clase se activa por configuración y por commit, sin reescribir código. Antes de empezar, cada
estudiante abre su fork y aprieta **Sync fork** → **Update branch** (ver [FLUJO_GIT.md](FLUJO_GIT.md)).

## 1. El disparador (cron)

En `backend/wrangler.jsonc`, al final:

1. Agrega una coma después de la llave que cierra el bloque `"vars": { … }`.
2. Quita las dos barras `//` delante de `"triggers": { "crons": ["30 12 * * *"] },`.
3. **Commit changes**. Al desplegarse, el agente corre solo todos los días a las 09:30 de Chile (12:30 UTC).

Verificar: en Cloudflare, Worker → **Settings → Trigger events → Cron triggers** muestra el cron. Al día siguiente,
`/borradores` tiene un borrador con `"motivo": "cron"` (o, si no hubo boletín nuevo, nada: es lo esperado).
El registro de cada corrida se lee en Worker → **Logs**.

## 2. El RAG en producción (AI Search)

1. En Cloudflare: **R2** → crear un bucket (Cloudflare pide una tarjeta aunque no cobre) → subir los PDF de los
   boletines.
2. **AI Search** → crear una instancia llamada `boletines-ene` conectada a ese bucket. Esperar a que indexe.
3. En `backend/wrangler.jsonc`, descomentar `"ai_search": [{ "binding": "CORPUS", "instance_name": "boletines-ene" }]`
   (cuidando la coma de la línea anterior) → **Commit changes**.

Verificar: en `/preguntar` (o en el frontend), la traza de `buscar_en_boletines` muestra resultados con
`"via": "AI Search"`. Si AI Search falla, la traza lo dice y el agente usa el corpus local.

## 3. MCP: prestar las herramientas a otros agentes

El servidor MCP ya está en `https://ia-toolkit.<subdominio>.workers.dev/mcp` (herramientas `ultima_tasa`,
`buscar_en_boletines`, `estado_del_agente`).

- Para Claude Code (demo del profesor): en `.mcp.json`, agregar
  `"agente-ene": { "type": "http", "url": "https://ia-toolkit.<subdominio>.workers.dev/mcp" }` y reiniciar la
  sesión.
- Entre equipos: cada equipo anota su URL de MCP en la sección "Mis direcciones" de su README; el otro equipo
  la agrega como servidor en su cliente.

## Regla para el profesor: actualizaciones del maestro sin conflictos

Los estudiantes editan estos archivos. **Las actualizaciones del maestro no los tocan**:

- `backend/src/agente/objetivo.md` (el bloque "Lo que el equipo editorial quiere cambiar")
- `backend/src/agente/skills/respuesta-ene.md`
- archivos nuevos en `backend/src/herramientas/` y la lista de `backend/src/herramientas/index.ts`
- `backend/wrangler.jsonc` (`NOMBRE_EQUIPO`, y las líneas de cron y `ai_search` que descomentan en esta clase)
- `frontend/lib/marca.ts`, `frontend/app/globals.css` y los textos de `frontend/app/transparencia/page.tsx`
- la sección "Mis direcciones" de `README.md`

Las piezas nuevas de las clases 8, 9 y 10 van en **archivos nuevos** o en bloques claramente delimitados con
un comentario (`// ── Clase 9: … ──`), lejos de las líneas que editan los estudiantes. Antes de publicar una
actualización, probar "Sync fork" en un fork de ensayo con cambios típicos de estudiante.

## Motor del agente: `propio` o `adk`

`MOTOR` en `backend/wrangler.jsonc` elige el motor del bucle. El valor por defecto del maestro es `propio`
hasta completar las pruebas 3 y 6 del spec.

- **Presupuesto de CPU.** El plan Free de Workers permite 10 ms de CPU por petición. El agente casi no usa CPU
  (el PDF lo convierte Workers AI; las llamadas a Gemini son espera de red), pero el motor `adk` carga más
  código (bundle de ~610 KB gzip frente a lo que usa el bucle propio). Si en producción aparecen errores
  "Exceeded CPU" (Worker → **Logs**) con `MOTOR=adk`, las salidas son volver a `MOTOR=propio` o pasar al plan
  Workers Paid (US$5/mes). Decisión del profesor.
- **Diferencia de comportamiento.** El motor propio prueba los modelos de `GEMINI_MODELOS` en orden y
  reintenta ante 429/5xx; el motor `adk` usa solo el primero. Con `adk`, si el modelo falla, la corrida
  igual devuelve un borrador que explica el error en `problemas` y en la traza.

### Registro de pruebas con clave real (prueba 3 del spec)

| Fecha | Motor | Modelo que respondió | Tiempo de `/correr?forzar=1` | Resultado / error textual |
|---|---|---|---|---|
| | propio | | | |
| | adk | | | |
