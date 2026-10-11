# Publicar la documentación

Este sitio se publica en **GitHub Pages** desde el repositorio. El despliegue incluye únicamente la documentación generada.

## Publicación automática

En **Settings → Pages → Build and deployment**, la fuente es **GitHub Actions**. El workflow `.github/workflows/pages.yml` construye y prueba la documentación; los cambios enviados a `main` publican el resultado. Los pull requests solo validan cambios. También puedes ejecutar **Documentation Pages → Run workflow** sobre `main`.

El artefacto es `docs/site/.vitepress/dist`. No incluye datos locales, credenciales ni el servidor de Hyperion. El despliegue usa el entorno `github-pages`, con permisos `pages: write` e `id-token: write`.

## Idiomas y rutas

El español sigue en [la raíz del sitio](https://0vas.github.io/hiperion/); el inglés está en [/en/](https://0vas.github.io/hiperion/en/). Las páginas equivalentes conservan su ruta para que el selector cambie de idioma sin perder la ubicación. Ambos idiomas se publican juntos.

El valor `base: '/hiperion/'` mantiene enlaces y recursos dentro del prefijo de Pages. Si renombras un fork, actualiza también las rutas del favicon y las expectativas de las pruebas.

## Verificar antes de publicar

```sh
npm --prefix docs/site ci
npm --prefix docs/site exec -- playwright install chromium
npm --prefix docs/site test
```

Puedes abrir el resultado con `npm --prefix docs/site run preview` y visitar `http://127.0.0.1:4175/hiperion/`.

Con GitHub Actions activado, si falla el despliegue, revisa el workflow **Documentation Pages** en Actions. Para volver a publicar, usa **Run workflow** sobre `main`. Si el contenido es incorrecto, revierte el cambio en el repositorio y deja que el workflow vuelva a publicar.

Referencias: [despliegue de VitePress](https://vitepress.dev/guide/deploy) y [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

El workflow reconstruye el sitio con la ruta devuelta por GitHub Pages (`HYPERION_DOCS_BASE`). Así, un cambio de nombre del repositorio no deja los recursos apuntando a la ruta anterior. Las pruebas locales conservan `/hiperion/` como ruta de referencia.
