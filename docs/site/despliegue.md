# Publicar la documentación

Este sitio se publica en **GitHub Pages** desde el repositorio. El despliegue incluye únicamente la documentación generada.

## Publicación automática

El workflow `.github/workflows/pages.yml` construye el sitio y verifica navegación, búsqueda y accesibilidad. Los pull requests validan cambios; los cambios de documentación integrados en `main` publican el resultado automáticamente.

El artefacto sale de `docs/site/.vitepress/dist`. No incluye datos locales, credenciales ni el servidor de Hyperion.

## Configuración del repositorio

En **Settings → Pages → Build and deployment**, la fuente debe ser **GitHub Actions**. El job de despliegue usa el entorno `github-pages` y permisos `pages: write` e `id-token: write`.

La URL de este repositorio es [0vas.github.io/hiperion](https://0vas.github.io/hiperion/). El valor `base: '/hiperion/'` permite cargar enlaces y recursos desde esa ruta. Si publicas un fork con otro nombre, cambia `base`, el favicon y las expectativas de las pruebas.

## Verificar antes de publicar

```sh
npm --prefix docs/site ci
npm --prefix docs/site exec -- playwright install chromium
npm --prefix docs/site test
```

Puedes abrir el resultado con `npm --prefix docs/site run preview` y visitar `http://127.0.0.1:4175/hiperion/`.

Si falla el despliegue, revisa el workflow **Documentation Pages** en Actions. Para volver a publicar, usa **Run workflow** sobre `main`. Si el contenido es incorrecto, revierte el cambio en el repositorio y deja que el workflow vuelva a publicar.

Referencias: [despliegue de VitePress](https://vitepress.dev/guide/deploy) y [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
