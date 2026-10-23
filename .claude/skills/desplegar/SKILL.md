---
name: desplegar
description: Explica y acompaña cómo un cambio del Agente ENE llega a producción (por commit o pull request, con despliegue automático en Cloudflare y Vercel) y comprueba que funcionó. Úsala cuando pidan "despliega", "sube los cambios", "ponlo en producción", "publica el cambio", "¿por qué no se ve mi cambio?" o después de editar el objetivo, una herramienta, los límites, la marca o el estilo.
---

# Desplegar

En este proyecto **no se despliega con comandos**. El fork del equipo está conectado a Cloudflare Workers
Builds (carpeta `backend`) y a Vercel (carpeta `frontend`): cada commit en `main` despliega solo la mitad que
cambió. Nunca ejecutes `wrangler deploy`, `wrangler login`, `wrangler secret`, `vercel` ni `vercel login`.

Antes de empezar, di qué cambió y en qué mitad (backend, frontend o ambas). Las URLs del equipo están en la
sección "Mis direcciones" del `README.md`.

## 1. Antes del commit

- Si cambió algo en `backend/`: `npm run check` en `backend/`. Si hay errores de tipos, explícalos en
  lenguaje llano y arréglalos antes.
- Si cambió algo en `frontend/`: `npm run build` en `frontend/` (opcional si no hay Node; la CI lo hará).

## 2. El commit (o el pull request)

- Cambio de texto simple (objetivo, marca, nombre del equipo): commit directo en `main`, con un mensaje en
  español que diga qué cambió.
- Cambio de código (herramienta, límites): rama + pull request con la plantilla completa. Esperar la marca
  verde de "Verificar" y fusionar.

## 3. Comprobar en producción

- **Backend:** esperar 1–2 minutos (Cloudflare → Worker → Deployments). Luego abrir `<backend_url>/` (debe
  decir "en línea") y, si el cambio afecta al agente, `<backend_url>/correr?forzar=1`. Muestra la parte de la
  traza que demuestra el cambio (el paso donde el modelo pidió la herramienta nueva, o el borrador con la regla
  aplicada). Si responde 409, hay otra corrida en curso: esperar 20 segundos y repetir.
- **Frontend:** esperar el despliegue en Vercel (Deployments) y pedir al equipo que recargue la página en el
  teléfono.

## Si no se ve el cambio

1. ¿El commit está en `main` del fork (no en otra rama ni en el maestro)?
2. ¿El build terminó? Cloudflare: Worker → Deployments / Builds. Vercel: Deployments. Si falló, lee la última
   línea roja del registro y explícala.
3. ¿Se cambió `NEXT_PUBLIC_API_URL`? Requiere **Redeploy** en Vercel.
4. ¿Faltan secretos? `GET /` dice `modelo: simulado` → el equipo agrega `GEMINI_API_KEY` en Cloudflare
   (Settings → Variables and Secrets). Tú nunca ves ni escribes la clave.
