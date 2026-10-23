# El flujo de trabajo, explicado para periodistas

Cinco palabras que vas a usar todo el semestre. Cada una con su equivalente en una redacción y con el ejemplo
del curso.

## Repositorio: la carpeta con su historia

Un repositorio es una carpeta de archivos que recuerda cada versión de cada archivo: quién cambió qué, cuándo
y por qué. Es como el archivo de una redacción donde ninguna versión de una nota se pierde.

> **En el curso:** `github.com/sil7en/agente-ene` es el repositorio maestro. Tiene el backend, el frontend y
> estas guías.

## Fork: tu copia

Un fork es una copia del repositorio en tu cuenta. Es tuya: la cambias sin pedir permiso y sin afectar el
original, pero sigue sabiendo de dónde vino. Es como recibir la pauta de la mesa central y trabajarla en tu
sección.

> **En el curso:** `github.com/<tu-usuario>/agente-ene`. Cloudflare y Vercel están conectados a tu fork, no al
> maestro: lo que cambies ahí es lo que se publica en tus URLs.

## Commit: una foto con mensaje

Un commit es guardar un cambio con una frase que dice qué cambió. Cada commit es una foto del repositorio en
ese momento; se puede volver a cualquiera. Es como el historial de versiones de un texto, pero con un pie de
foto obligatorio.

> **En el curso:** editas `backend/src/agente/objetivo.md` en GitHub, escribes "Regla: titular con pp." y
> aprietas **Commit changes**. En uno o dos minutos Cloudflare despliega el backend nuevo, sin que hagas nada
> más. Lo mismo con `frontend/lib/marca.ts` y Vercel.

## Rama y pull request: una propuesta de cambio

Una rama es una línea paralela de trabajo: los cambios quedan ahí, sin tocar la versión publicada (`main`).
Un pull request (PR) es la propuesta de llevar esos cambios a `main`: muestra qué líneas cambian (el *diff*),
permite comentar y se acepta con **Merge**. Es como un borrador que pasa por el editor antes de ir a portada.

> **En el curso:** Jules trabaja siempre así. Le pides "agrega una herramienta calcular_variacion", Jules crea
> una rama, hace los cambios y abre un PR. La CI "Verificar" le pone una marca verde (compila) o roja (no
> compila). Tú lees el cambio, y si te convence, **Merge pull request**. Al fusionar, Cloudflare despliega.

## Sync fork: traer lo nuevo del maestro

Cuando el profesor agrega algo al maestro (por ejemplo, las piezas de la clase 8), tu fork no lo recibe solo.
En tu fork, el botón **Sync fork** → **Update branch** trae esos cambios y los mezcla con los tuyos. Es como
recibir la actualización de la pauta sin perder lo que ya escribiste.

> **En el curso:** al empezar las clases 8, 9 y 10, abre tu fork y aprieta **Sync fork**. Si GitHub dice que
> hay conflictos, avisa al profesor antes de descartar nada: los archivos que tú editas están pensados para no
> chocar con las actualizaciones.
