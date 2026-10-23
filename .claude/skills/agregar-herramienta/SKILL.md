---
name: agregar-herramienta
description: Crea y registra una herramienta nueva para el Agente ENE (algo que el modelo puede pedir y el programa ejecuta), la despliega y demuestra en la traza que el modelo la usó. Úsala cuando pidan "agrega una herramienta", "que el agente pueda calcular/consultar/comparar…", "nueva función del agente".
---

# Agregar una herramienta

Una herramienta tiene cuatro partes: nombre, descripción, parámetros y lo que hace. **La descripción es la más
importante**: es lo único que el modelo lee para decidir si la usa y cuándo. El código lo ejecuta el programa.

## Pasos

1. Pregunta (o deduce del pedido) tres cosas, en lenguaje de redacción: qué debe hacer la herramienta, qué
   datos necesita recibir y qué devuelve. Repite tu entendimiento en una frase antes de escribir código.
2. Copia `backend/src/herramientas/_plantilla.ts` a `backend/src/herramientas/<nombre>.ts`. Completa:
   - `nombre`: minúsculas con guiones bajos (por ejemplo `calcular_variacion`).
   - `descripcion`: para qué sirve y cuándo usarla, en una o dos frases completas.
   - `parametros`: cada dato con su `description`; marca los obligatorios en `required`.
   - `ejecutar`: la lógica. Si necesita la memoria o la IA, están en `ctx.env`. Si falla, lanza un Error con
     un mensaje que una persona entienda: ese mensaje vuelve al modelo.
3. Regístrala en la lista `herramientas` de `backend/src/herramientas/index.ts`.
4. `npm run check` en `backend/`.
5. Si la herramienta debería usarse en la redacción, agrega una línea en
   `backend/src/agente/skills/respuesta-ene.md` que diga cuándo usarla (el procedimiento es lo que el modelo
   sigue).
6. Despliega con la skill `desplegar` y fuerza una corrida. En la traza, muestra el paso
   `El modelo pidió <nombre>(...)` y el resultado. Si el modelo no la pidió, revisa primero la descripción y
   el procedimiento, no el código.

## Ejemplos que funcionan bien en este proyecto

- `calcular_variacion(actual, anterior)` → diferencia en puntos porcentuales y variación relativa, con la
  regla de que las tasas se comparan en pp.
- `comparar_con_hace_un_ano(numero)` → obtiene el boletín del mismo trimestre del año anterior (12 ediciones
  antes) y devuelve ambas tasas.
- `glosario(termino)` → busca una definición en el corpus del curso.
- `tasa_por_sexo()` → extrae las tasas masculina y femenina del último boletín.
