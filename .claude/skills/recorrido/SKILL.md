---
name: recorrido
description: Explica el proyecto del Agente ENE pieza por pieza, en lenguaje de redacción, mostrando dónde vive cada concepto del curso (objetivo, herramientas, bucle, memoria, límites, MCP, frontend) y cómo se ve en producción. Úsala cuando pregunten "¿qué hay aquí?", "explícame el proyecto", "¿qué es cada carpeta?", "¿dónde está el agente?".
---

# Recorrido por el Agente ENE

Haz el recorrido en este orden, mostrando un fragmento corto de cada archivo (no el archivo entero) y
explicando en dos o tres frases qué concepto encarna. Usa las URLs reales del equipo: están en la sección
"Mis direcciones" del `README.md` del fork (si está vacía, pídeselas al equipo).

1. **El objetivo** · `backend/src/agente/objetivo.md`. Qué debe lograr el agente y sus reglas. Es texto, lo
   escribe el equipo. Cambiarlo cambia al agente sin tocar código.
2. **El procedimiento (skill)** · `backend/src/agente/skills/respuesta-ene.md`. Cómo se redacta la nota paso
   a paso. También es texto.
3. **Las herramientas** · `backend/src/herramientas/index.ts` y sus archivos. Lo que el agente puede hacer en
   el mundo: descargar el boletín, buscar en el corpus, consultar su memoria. Muestra una declaración
   completa (nombre, descripción, parámetros) y explica que el modelo no ejecuta nada: pide, y el programa
   ejecuta.
4. **El bucle** · `backend/src/agente/bucle.ts`. Muestra solo el `for` principal y explica el ciclo: el
   modelo decide, el programa ejecuta, el resultado vuelve al contexto, se repite hasta que el modelo entrega
   con `entregar_borrador`. Esto es lo que convierte un modelo en un agente. El humano está afuera. Menciona
   que `motor-adk.ts` hace lo mismo con el kit de Google (ADK) y que la variable `MOTOR` elige cuál corre.
5. **La memoria** · `backend/src/herramientas/memoria.ts`, `backend/src/memoria-durable.ts` y la línea
   `durable_objects` de `wrangler.jsonc`. Un Durable Object es un objeto con su propio disco (una pequeña base
   SQLite) que vive en Cloudflare. Qué recuerda entre corridas y por qué sin memoria publicaría lo mismo cada día.
6. **Los límites** · `backend/src/agente/limites.ts`. Reglas que revisa el programa después de que el modelo
   escribe. Muestra una.
7. **El disparador** · la línea `triggers` comentada en `wrangler.jsonc` y la función `scheduled` en
   `index.ts`. Hoy el agente corre cuando alguien aprieta un botón; en la clase 8 correrá solo.
8. **El servidor MCP** · `backend/src/mcp.ts`. Las mismas herramientas, prestadas a otros agentes por un
   estándar. Muestra la URL `<mcp_url>`.
9. **El frontend** · `frontend/app/page.tsx`, `borradores`, `preguntar`, `transparencia` y `lib/marca.ts`.
   La cara pública, en otro servidor (Vercel), que solo habla con el backend por HTTP. Muestra la URL
   `<frontend_url>`.
10. **El camino a producción** · `.github/workflows/verificar.yml` y el flujo fork → commit → despliegue
    automático (Cloudflare para `backend`, Vercel para `frontend`). Pide que abran `<backend_url>/` y
    `<frontend_url>` en el teléfono.

Cierra con la frase: "Para cambiar lo que el agente hace, se cambia el objetivo, el procedimiento, las
herramientas o los límites; el bucle no se toca."
