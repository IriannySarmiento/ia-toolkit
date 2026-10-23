---
name: desplegar
description: Pone en producción los cambios del Agente ENE (backend en Cloudflare, frontend en Vercel o ambos) y comprueba que funcionan. Úsala cuando pidan "despliega", "sube los cambios", "ponlo en producción", "publica el cambio" o después de editar el objetivo, una herramienta, los límites, la marca o el estilo.
---

# Desplegar

Antes de empezar, di qué vas a desplegar y por qué (qué cambió). Lee `equipo.json` para conocer las URLs.

## Backend (si cambió algo en `backend/`)

1. En `backend/`: `npm run check`. Si hay errores de tipos, explícalos en lenguaje llano y arréglalos antes.
2. `npx wrangler deploy`. Muestra la URL.
3. Comprueba: `curl -s <backend_url>/` (debe responder "en línea"). Si el cambio afecta al agente (objetivo,
   skill, herramientas, límites), fuerza una corrida:
   `curl -s -X POST <backend_url>/correr -H 'content-type: application/json' -d '{"forzar":true}'`
   y muestra la parte de la traza que demuestra el cambio (por ejemplo, el paso donde el modelo pidió la
   herramienta nueva, o el borrador con la regla nueva aplicada). Si la respuesta es 409, hay otra corrida en
   curso: espera 20 segundos y repite.
4. Di en una frase qué debería notar el equipo al abrir `<frontend_url>/borradores`.

## Frontend (si cambió algo en `frontend/`)

1. En `frontend/`: `npx vercel deploy --prod --yes`. Muestra la URL de producción.
2. Si el error habla de `NEXT_PUBLIC_API_URL` o la página dice que no puede hablar con el backend:
   `npx vercel deploy --prod --yes --build-env NEXT_PUBLIC_API_URL=<backend_url>`.
3. Comprueba: `curl -s -o /dev/null -w '%{http_code}' <frontend_url>` → 200. Pide al equipo que recargue en el
   teléfono.

## Reglas

- Nunca uses `--force` ni borres recursos.
- Si el despliegue falla por sesión vencida (`wrangler login` / `vercel login`), avisa que se abrirá el
  navegador y pide al profesor que inicie sesión; no lo intentes repetidamente.
- Al terminar, actualiza `equipo.json` si alguna URL cambió.
