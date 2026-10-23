# Frontend del Agente ENE

La cara pública del agente: la nota publicada (`/`), la mesa de edición (`/borradores`), las preguntas de
lectores (`/preguntar`) y la página de transparencia (`/transparencia`). Es una app Next.js que solo habla con
el backend por HTTP; no tiene claves ni memoria propias.

## Configuración en Vercel (una vez)

Vercel detecta dos aplicaciones en el repositorio (`backend` y `frontend`). En la fila **frontend**, aprieta
**Import single project**; con eso quedan:

| Campo en Vercel | Valor |
|---|---|
| Repositorio | tu fork de `ia-toolkit` |
| **Root Directory** | `frontend` (lo pone **Import single project**) |
| Application Preset | Next.js |
| Build and Output Settings | sin tocar |
| **Environment Variables** | `NEXT_PUBLIC_API_URL` = la URL de tu backend, **sin barra final**. Ej.: `https://ia-toolkit.tu-subdominio.workers.dev` |
| Environments | Production and Preview (viene así) |

Guía con capturas: [docs/PASO_A_PASO.md](../docs/PASO_A_PASO.md#4-vercel-publicar-la-página).

Si la variable falta o está mal escrita, la portada lo dice con el nombre exacto de la variable. Como Next.js
la lee al construir la página, después de cambiarla hay que volver a desplegar: **Deployments → ⋯ → Redeploy**.

## Qué edita el equipo

- `lib/marca.ts`: nombre, lema, equipo y declaración corta. Se edita en GitHub y Vercel redespliega solo.
- `app/globals.css`: colores y tipografías (variables en `:root`).
- `app/transparencia/page.tsx`: los textos entre corchetes.

## Probar en local (opcional)

```bash
npm ci
npm run dev
```

Abre http://localhost:3000. Sin `.env.local`, usa el backend local de `wrangler dev` (http://localhost:8787).
