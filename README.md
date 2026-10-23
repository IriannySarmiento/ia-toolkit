# Agente ENE · kit del curso "Agentes de IA para periodismo" (U. de Chile, 2026)

Un agente real, en producción, construido por estudiantes de periodismo con una herramienta de desarrollo
agéntica (Claude Code o Antigravity). Vigila los boletines de empleo del INE, redacta un borrador con fuentes y
lo deja para aprobación humana. Backend en Cloudflare Workers (gratis), frontend en Next.js sobre Vercel
(gratis), modelo Gemini (clave del profesor).

## Cómo se usa

1. Abrir esta carpeta en la app de escritorio de Claude (pestaña **Code**) o en Antigravity.
2. Escribir en español. El agente de desarrollo lee `CLAUDE.md` (o `AGENTS.md`) y sabe qué es cada cosa.
3. Las tareas frecuentes tienen una skill: `/recorrido` (explicar el proyecto), `/puesta-a-punto` (primer
   despliegue, con el profesor), `/desplegar`, `/agregar-herramienta`.

Nadie necesita abrir una terminal. Los comandos los propone y ejecuta el agente de desarrollo; el equipo los
lee y aprueba.

## Qué hay

- `backend/` · el agente: objetivo (`objetivo.md`), procedimiento (`skills/respuesta-ene.md`), herramientas
  (`herramientas/`), bucle (`bucle.ts`), memoria (KV), límites (`limites.ts`), servidor MCP (`mcp.ts`),
  disparador (`scheduled` + cron). Rutas: `GET /`, `POST /correr`, `GET /borradores`, `GET /borradores/:id`,
  `POST /aprobar`, `POST /rechazar`, `GET /nota`, `POST /preguntar`, `POST /mcp`.
- `frontend/` · la página pública: portada con la nota publicada y botón para correr el agente, mesa de
  edición (aprobar/rechazar con nombre y clave), preguntas con fuentes y traza, transparencia.
- `equipo.json` · letra del equipo y URLs en producción. `configurar.mjs` · pone la letra en todas partes.
- `.mcp.json` · servidores MCP que el agente de desarrollo tiene disponibles (hoy: la documentación de
  Cloudflare; en la clase 8, el `/mcp` del propio equipo).

## Cuentas y costos

- Claude Code: requiere Claude Pro (o superior). Dos cuentas del curso para dos estaciones; las otras dos
  estaciones usan Antigravity (Google), nivel Individual gratuito, con el mismo kit.
- Cloudflare: una cuenta del curso, plan Free. Para R2 (clase 8) Cloudflare pide una tarjeta aunque no cobre.
- Vercel: una cuenta Hobby del curso, un proyecto por equipo (`agente-ene-a`, `-b`, `-c`, `-d`).
- Gemini: una clave por equipo, guardada como secreto del Worker. Si falta, el agente corre en modo simulado.

## Si algo falla

- El frontend dice que no puede hablar con el backend → falta `NEXT_PUBLIC_API_URL` en Vercel:
  `npx vercel deploy --prod --yes --build-env NEXT_PUBLIC_API_URL=<URL del backend>`.
- `GET /` dice `modelo: simulado` → la clave de Gemini no llegó: revisar `.dev.vars` y
  `npx wrangler secret bulk .dev.vars`.
- `POST /correr` responde 409 → ya hay una corrida en curso; esperar 20 segundos.
- La traza dice "INE no respondió; usé el corpus local" → el sitio del INE no respondió desde Cloudflare; el
  agente siguió con los boletines conocidos. Es el plan B previsto.
- Sesión vencida de wrangler o vercel → `npx wrangler login` / `npx vercel login` con el profesor presente.

## Probar en local (opcional)

`backend/`: `npx wrangler dev --port 8787` · `frontend/`: `npm run dev` (abre http://localhost:3000). Sin
clave de Gemini, corre con el modelo simulado.
