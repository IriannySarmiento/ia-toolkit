---
name: puesta-a-punto
description: Deja el Agente ENE de un equipo listo en producción por primera vez (backend en Cloudflare y frontend en Vercel). Se usa una sola vez por computador, con el profesor presente, el día antes de la clase. Úsala cuando pidan "puesta a punto", "dejar todo listo", "configurar el equipo" o "primer despliegue".
---

# Puesta a punto del Agente ENE

Objetivo: que al terminar, el equipo tenga su backend y su frontend en producción, con URLs anotadas en
`equipo.json`, y que la persona que te acompaña haya visto cada paso explicado. Sigue el orden. En cada paso,
di en una frase qué vas a hacer y por qué, ejecuta, y confirma el resultado antes de seguir. Si algo falla,
explica la causa en lenguaje llano y propone el arreglo; no sigas al paso siguiente con un paso roto.

## 0. Requisitos del computador

1. `node -v` → debe ser 20 o superior. Si no hay Node, detente: hay que instalarlo desde nodejs.org
   (instalador normal, botón LTS) y volver a abrir la app.
2. Lee `equipo.json`. Si `equipo` es "sin configurar", pregunta la letra del equipo (a, b, c o d) y ejecuta
   `node configurar.mjs <letra>`. Muestra qué archivos cambiaron.

## 1. Backend en Cloudflare

Trabaja en `backend/`.

1. `npm install` (instala las piezas que el Worker necesita; tarda un minuto).
2. `npm run check` → sin errores.
3. `npx wrangler whoami`. Si dice que no hay sesión: avisa que se abrirá el navegador para iniciar sesión en
   Cloudflare con la cuenta del curso y ejecuta `npx wrangler login`. Espera a que la persona confirme.
   Vuelve a correr `whoami` y muestra la cuenta.
4. Memoria: si `wrangler.jsonc` todavía dice `"id": "pendiente-de-crear"`, ejecuta
   `npx wrangler kv namespace create MEMORIA`, toma el `id` que imprime y escríbelo en `wrangler.jsonc`.
   Explica: KV es la memoria del agente; sin ella repetiría el mismo boletín cada día.
5. Secretos: comprueba con `ls -la .dev.vars` si existe. Si no, ejecuta `cp .dev.vars.example .dev.vars` y
   pide a la persona que abra `backend/.dev.vars` y escriba ella misma la clave de Gemini (la entrega el
   profesor) y una clave de aprobación inventada por el equipo. No leas ni repitas ese archivo. Cuando
   confirme, ejecuta `npx wrangler secret bulk .dev.vars`. Explica: las claves viajan a Cloudflare cifradas y
   nunca van en el código ni en la página.
6. `npx wrangler deploy`. Si es el primer despliegue de la cuenta, wrangler puede pedir registrar un
   subdominio `workers.dev`: hazlo con el nombre que proponga o con `agentes-periodismo`. Toma la URL que
   imprime (termina en `.workers.dev`) y guárdala en `equipo.json` como `backend_url`, y `mcp_url` =
   `backend_url` + `/mcp`.
7. Prueba en producción y muestra los resultados completos:
   - `curl -s <backend_url>/` → debe decir `"estado": "en línea"` y el modelo configurado.
   - `curl -s -X POST <backend_url>/correr -H 'content-type: application/json' -d '{"forzar":true}'` → debe
     devolver un borrador con `traza`. Lee la traza en voz alta: qué pidió el modelo, qué devolvió la
     herramienta, qué dijeron los límites. Si `modelo` dice "simulado", la clave de Gemini no llegó: revisa
     el paso 5.

## 2. Frontend en Vercel

Trabaja en `frontend/`.

1. `npm install`.
2. `npx vercel whoami`. Si no hay sesión: avisa que `npx vercel login` abrirá el navegador o pedirá un correo
   (el del curso) y enviará un enlace de confirmación. Espera la confirmación.
3. `npx vercel link --yes --project agente-ene-<letra>` (vincula esta carpeta con un proyecto nuevo con el
   nombre del equipo; así los cuatro equipos no se pisan).
4. `printf '%s' "<backend_url>" | npx vercel env add NEXT_PUBLIC_API_URL production` (le dice al frontend
   dónde vive su backend).
5. `npx vercel deploy --prod --yes`. Toma la URL de producción (termina en `.vercel.app`) y guárdala en
   `equipo.json` como `frontend_url`.
6. `curl -s -o /dev/null -w '%{http_code}' <frontend_url>` → 200. Pide a la persona que abra la URL en el
   teléfono: debe ver la portada, apretar "Forzar una corrida" y ver la traza. Luego, en Borradores, aprobar
   con su nombre y la clave del equipo, y ver la nota en la portada.

## 3. Cierre

Imprime la tarjeta del equipo para que la copien en el material de sala:

```
Equipo <letra>
Backend:  <backend_url>
Frontend: <frontend_url>
MCP:      <mcp_url>
Modelo:   <lo que dijo GET /> 
```

Y recuerda en dos líneas qué quedó hecho: hay un agente corriendo en producción que todavía no corre solo
(el cron está apagado hasta la clase 8), con memoria, límites y una página pública.
