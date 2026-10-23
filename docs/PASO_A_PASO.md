# Paso a paso: del fork a producción

Para proyectar en clase. Los nombres **en negrita** son los textos de los botones y campos tal como aparecen en
los paneles. Fuente: documentación oficial de Cloudflare y Vercel consultada el 22-10-2026.

> **Pendiente de verificar en pantalla (prueba 6 del spec).** Los paneles cambian. Lo marcado con ⚠ salió de la
> documentación, no de una captura: en el ensayo con la segunda cuenta, corregir este archivo con lo que
> realmente aparece y anotar las diferencias al final.

Necesitas: cuentas de GitHub, Cloudflare y Vercel verificadas por correo; la clave de Gemini de tu equipo (la
entrega el profesor) y una clave de aprobación inventada por el equipo (una frase).

---

## 0. El fork (2 minutos)

1. Abre **github.com/sil7en/agente-ene**.
2. Arriba a la derecha: **Fork** → deja el nombre `agente-ene` → **Create fork**.
3. Punto de control: estás en `github.com/<tu-usuario>/agente-ene` y ves `backend`, `frontend`, `docs`.

---

## 1. Backend en Cloudflare (10–15 minutos)

1. Entra a **dash.cloudflare.com** → menú izquierdo **Workers & Pages** (en el panel nuevo puede aparecer
   dentro de **Compute (Workers)**).
2. **Create application** ⚠ → elige **GitHub** (no "Pages": eso es otro producto).
   - La primera vez, Cloudflare pide autorizar su app en GitHub: elige **Only select repositories** →
     tu `agente-ene` → **Install & Authorize**.
3. Elige el repositorio `agente-ene` de la lista.
4. Pantalla **Configure your project** ⚠:

   | Campo | Qué escribir |
   |---|---|
   | **Project name** / nombre del Worker | `agente-ene` — exactamente así. Si no coincide con `name` en `backend/wrangler.jsonc`, el build falla. |
   | **Build command** | vacío |
   | **Deploy command** | `npx wrangler deploy` (suele venir escrito) |
   | **Root directory** (a veces dentro de *Advanced settings*) | `backend` |
   | **API token** | dejar el que crea Cloudflare |
   | **Build variables and secrets** | nada: lo que se ponga aquí solo existe durante el build, **no** llega al agente |

5. **Save and Deploy**. Cloudflare instala las dependencias, compila y despliega. Mide el tiempo del primer
   build. Si falla, abre el registro del build: la última línea roja dice por qué (ver la tabla del README).
6. **Subdominio `workers.dev`** ⚠: en una cuenta nueva, Cloudflare asigna o pide registrar un subdominio la
   primera vez. Se ve y se cambia en **Workers & Pages** → **Your subdomain** → **Change**. Usa algo corto y
   reconocible (tu usuario de GitHub, por ejemplo).
7. Copia la URL que muestra el Worker: `https://agente-ene.<tu-subdominio>.workers.dev`.
8. Punto de control: ábrela. Debe decir `"estado": "en línea"`, `"motor": "propio"` y
   `"modelo": "simulado (sin clave de Gemini)"`. Todavía no hay claves: eso es lo siguiente.

### 1b. Los secretos (3 minutos)

Los secretos se agregan cuando el Worker ya existe (la pantalla de creación no tiene dónde ponerlos).

1. **Workers & Pages** → `agente-ene` → **Settings** → sección **Variables and Secrets** → **Add**.
2. Tipo **Secret**. **Variable name**: `GEMINI_API_KEY`. **Value**: la clave del equipo.
3. **Add variable** → Tipo **Secret**. **Variable name**: `CLAVE_APROBACION`. **Value**: la frase del equipo.
4. **Deploy**. Esto publica una versión nueva del Worker con los secretos; no hace falta otro commit.
5. Punto de control: recarga la URL del backend. Ahora `"modelo"` dice `gemini-…`.

Los secretos quedan guardados en Cloudflare y sobreviven a los despliegues por commit. Nunca se escriben en
GitHub.

### 1c. Primera corrida (2 minutos)

1. Abre `https://agente-ene.<tu-subdominio>.workers.dev/correr?forzar=1`. Tarda entre 10 y 40 segundos.
2. Punto de control: aparece un borrador con `titulo`, `cifras`, `fuentes` y `traza`. En la traza, busca
   `El modelo pidió obtener_ultimo_boletin({})` y `El modelo entregó con entregar_borrador.`

---

## 2. Frontend en Vercel (5–8 minutos)

1. Entra a **vercel.com** (con "Continue with GitHub") → **Add New…** → **Project**.
2. En **Import Git Repository**, busca `agente-ene` → **Import**. Si no aparece: **Adjust GitHub App
   Permissions** ⚠ → autoriza el repositorio.
3. Pantalla de configuración:

   | Campo | Qué escribir |
   |---|---|
   | **Project Name** | el que quieras; define la URL `https://<nombre>.vercel.app` |
   | **Framework Preset** | Next.js (lo detecta solo) |
   | **Root Directory** → **Edit** | elige `frontend` → **Continue** |
   | **Environment Variables** ⚠ | Key `NEXT_PUBLIC_API_URL`, Value la URL de tu backend **sin barra final** |

4. **Deploy**. Cuando termine, **Continue to Dashboard** y copia la URL de producción.
5. Revisa que la variable quede en **Production** y **Preview**: proyecto → **Settings** → **Environment
   Variables**. Si la cambias después, hay que redesplegar (**Deployments** → ⋯ en el último → **Redeploy** ⚠):
   Next.js la lee al construir la página.
6. Punto de control, en el teléfono: la portada carga; **Forzar una corrida** muestra la traza; en
   **Borradores**, aprueba con tu nombre y la clave de aprobación; vuelve a **La nota**: está publicada.
   En **Preguntar**, haz una pregunta: la respuesta trae fuentes.

---

## 3. Anota tus direcciones

En tu fork, edita `README.md` (lápiz) y completa la sección **Mis direcciones** al final. **Commit changes**.
Este commit también sirve para comprobar que Cloudflare y Vercel se enteran de los cambios.

---

## Resultado del ensayo (completar después de la prueba 6 del spec)

| Paso | Tiempo real | ¿La pantalla coincidió con lo escrito? Diferencias |
|---|---|---|
| 0. Fork | | |
| 1. Worker creado + primer build | | |
| 1b. Secretos | | |
| 1c. Primera corrida | | |
| 2. Vercel | | |
| Commit en `objetivo.md` → redespliegue de Cloudflare | | |
| Commit en `marca.ts` → redespliegue de Vercel | | |
| Tarea a Jules → PR → CI → merge → traza | | |
| Sync fork sin conflictos | | |
