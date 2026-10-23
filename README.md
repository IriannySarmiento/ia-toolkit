# Agente ENE

**Curso "Agentes de IA para periodismo" · Universidad de Chile · 2026**

Un agente de IA que vigila los boletines de empleo del INE. Cuando aparece uno nuevo, lo lee, redacta un
borrador de nota con sus fuentes y lo deja esperando a que una persona del equipo lo apruebe. Tiene una página
pública donde se publica la nota, se le pueden hacer preguntas y se explica cómo funciona. Cada estudiante
tiene su propia copia en internet, y la cambia sin instalar nada: editando archivos en GitHub o pidiéndoselo
a Jules.

## Cómo llega tu agente a internet

```
  sil7en/agente-ene        tu fork            Cloudflare (backend)          tu agente
  (repositorio maestro) ─▶ tu-usuario/   ─┬─▶ build + deploy ─────────▶ https://agente-ene.<tu-subdominio>.workers.dev
                           agente-ene     │
                           (tu copia)     └─▶ Vercel (frontend) ───────▶ https://<tu-proyecto>.vercel.app
                              ▲
                              └── cada commit en main vuelve a desplegar lo que cambió
```

## Los cinco pasos de la clase

| # | Paso | Punto de control: abre esto | Debe verse |
|---|---|---|---|
| 1 | **Fork**: en github.com/sil7en/agente-ene, botón *Fork* → *Create fork* | `github.com/<tu-usuario>/agente-ene` | Tu copia, con las carpetas `backend` y `frontend` |
| 2 | **Backend en Cloudflare**: crear el Worker desde tu fork (ver [docs/PASO_A_PASO.md](docs/PASO_A_PASO.md)) | `https://agente-ene.<tu-subdominio>.workers.dev/` | `"estado": "en línea"` y `"modelo": "simulado…"` |
| 3 | **Secretos**: en Cloudflare, Settings → Variables and Secrets: `GEMINI_API_KEY` y `CLAVE_APROBACION` | la misma URL, recargada | `"modelo": "gemini-…"` |
| 4 | **Primera corrida**: abre `/correr?forzar=1` en el navegador | `https://agente-ene.<tu-subdominio>.workers.dev/correr?forzar=1` | Un borrador con su `traza`: qué pidió el modelo y qué recibió |
| 5 | **Frontend en Vercel**: importar tu fork, carpeta `frontend`, variable `NEXT_PUBLIC_API_URL` | `https://<tu-proyecto>.vercel.app` | La portada; *Forzar una corrida*; aprobar en *Borradores*; la nota publicada |

Guía con cada pantalla y cada campo: [docs/PASO_A_PASO.md](docs/PASO_A_PASO.md). Qué es un fork, un commit
o un pull request: [docs/FLUJO_GIT.md](docs/FLUJO_GIT.md). Cómo pedirle cambios a Jules:
[docs/JULES.md](docs/JULES.md).

## Los tres lugares que vas a editar

1. **El objetivo del agente**: `backend/src/agente/objetivo.md`, el bloque *"Lo que el equipo editorial quiere
   cambiar"*. Una regla, un efecto medible. Al hacer commit, Cloudflare vuelve a desplegar el backend.
2. **La marca**: `frontend/lib/marca.ts` (nombre, lema, equipo) y los colores de `frontend/app/globals.css`.
   Al hacer commit, Vercel vuelve a desplegar el frontend.
3. **El nombre del equipo en el backend**: `backend/wrangler.jsonc`, la línea `"NOMBRE_EQUIPO": "Mi equipo"`.

Para editar: abre el archivo en GitHub, aprieta el lápiz (o la tecla punto `.` para el editor web), cambia el
texto y aprieta **Commit changes**. Para cambios con código (una herramienta nueva), pídeselo a Jules con la
plantilla de issue "Nueva herramienta".

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El build de Cloudflare falla con "Worker name … must match" | El nombre del Worker en el panel no es `agente-ene` | Créalo de nuevo con el nombre exacto `agente-ene` |
| El build de Cloudflare falla en la instalación (`npm ci`, `ERESOLVE` o "lock file") | Se borró o cambió `backend/.npmrc`, o se editó `package.json` a mano | Restaurar `.npmrc` (una línea: `legacy-peer-deps=true`) y deshacer el cambio de `package.json` |
| `GET /` dice `"modelo": "simulado (sin clave de Gemini)"` | La clave de Gemini no está en el panel | Settings → Variables and Secrets → Add → Secret `GEMINI_API_KEY` → Deploy |
| Aprobar dice "Clave de aprobación incorrecta" | Falta el secreto `CLAVE_APROBACION` o se escribió distinto | Revisarlo en el panel; se distingue mayúscula de minúscula |
| La portada dice "Falta la variable NEXT_PUBLIC_API_URL" | La variable no está en Vercel | Vercel → Settings → Environment Variables → agregarla → Deployments → Redeploy |
| La portada dice "No pude hablar con el backend en …" | La URL está mal escrita o el backend no está desplegado | Abrir esa URL; debe responder `"estado": "en línea"`. Sin barra final |
| `/correr` responde 409 | Ya hay una corrida en curso | Esperar 20 segundos y repetir |
| La traza dice "INE no respondió; usé el corpus local" | El sitio del INE no respondió desde Cloudflare | Nada: es el plan B previsto, el agente siguió con los boletines conocidos |
| Hice commit y no cambió nada | El despliegue aún corre o falló | Cloudflare: Worker → Deployments / Builds. Vercel: Deployments. Ver el error |
| La marca de un pull request está roja | La CI "Verificar" encontró un error | Abrir *Details*; pedirle a Jules que lo corrija en el mismo pull request |

## El motor del agente

El bucle del agente tiene dos implementaciones, y se elige con la variable `MOTOR` de `backend/wrangler.jsonc`:
`propio` (el bucle de `backend/src/agente/bucle.ts`, para leerlo entero) o `adk` (el Agent Development Kit de
Google, `backend/src/agente/motor-adk.ts`). Las herramientas, la memoria y la traza son las mismas.

**Valor por defecto: `propio`.** La decisión definitiva se toma después de las pruebas con clave real y en
producción (sección 7 del spec) y se anota aquí.

## Mis direcciones

<!-- Este bloque es tuyo: complétalo después del paso 5. Las actualizaciones del maestro no lo tocan. -->

- Backend: `https://agente-ene.<tu-subdominio>.workers.dev`
- Frontend: `https://<tu-proyecto>.vercel.app`
- MCP: `https://agente-ene.<tu-subdominio>.workers.dev/mcp`
