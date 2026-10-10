# Publicar la documentación

Este sitio se publica en **GitHub Pages** desde el repositorio. El despliegue incluye únicamente la documentación generada.

## Publicación inicial

La primera publicación usa la rama `gh-pages` con el sitio estático generado. La integración del código fuente y el workflow en `main` está en el [PR #6](https://github.com/0vas/hiperion/pull/6), sujeta a las revisiones y controles del repositorio. Hasta que se integre, las actualizaciones del sitio se publican en esa rama.

## Publicación automática tras integrar el workflow

Al integrar el workflow en `main`, cambia la fuente de Pages a **GitHub Actions** y ejecútalo desde Actions.

El workflow `.github/workflows/pages.yml` construye el sitio y verifica navegación, búsqueda y accesibilidad. Los pull requests validan cambios; una vez activada esa fuente, los cambios de documentación integrados en `main` publican el resultado automáticamente.

El artefacto sale de `docs/site/.vitepress/dist`. No incluye datos locales, credenciales ni el servidor de Hyperion.

## Configuración del repositorio

En **Settings → Pages → Build and deployment**, usa **Deploy from a branch → gh-pages → / (root)** para la publicación inicial, o **GitHub Actions** para el workflow. El job de despliegue usa el entorno `github-pages` y permisos `pages: write` e `id-token: write`.

La URL de este repositorio es [0vas.github.io/hiperion](https://0vas.github.io/hiperion/). El valor `base: '/hiperion/'` permite cargar enlaces y recursos desde esa ruta. Si publicas un fork con otro nombre, cambia `base`, el favicon y las expectativas de las pruebas.

## Verificar antes de publicar

```sh
npm --prefix docs/site ci
npm --prefix docs/site exec -- playwright install chromium
npm --prefix docs/site test
```

Puedes abrir el resultado con `npm --prefix docs/site run preview` y visitar `http://127.0.0.1:4175/hiperion/`.

Con GitHub Actions activado, si falla el despliegue, revisa el workflow **Documentation Pages** en Actions. Para volver a publicar, usa **Run workflow** sobre `main`. Si el contenido es incorrecto, revierte el cambio en el repositorio y deja que el workflow vuelva a publicar.

Referencias: [despliegue de VitePress](https://vitepress.dev/guide/deploy) y [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
