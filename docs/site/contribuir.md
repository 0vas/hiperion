# Contribuir

Hyperion es independiente y está disponible bajo [licencia MIT](https://github.com/0vas/hiperion/blob/main/LICENSE). Las mejoras deben funcionar sin depender de un único proveedor de IA.

## Preparar el proyecto

Estas instrucciones son para desarrollo. Para usar Hyperion, empieza por la [guía de instalación](./guia/primeros-pasos.md).

```sh
git clone https://github.com/0vas/hiperion.git
cd hiperion
npm ci
npm run check
```

Requiere Node.js 22.13 o superior. Define primero el comportamiento esperado y una prueba que falle; implementa el cambio y verifica el resultado.

## Validar una contribución

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

Para cambios visuales, comprueba temas claro/oscuro, navegación con teclado y ventanas estrechas. Para protocolo, mantén las reglas compartidas en `src/domain/`.

Nunca incluyas `.hyperion/`, respuestas reales, tokens ni trazas privadas en una contribución. Usa datos sintéticos para ejemplos y pruebas.

## Editar este sitio

```sh
npm --prefix docs/site ci
npm --prefix docs/site run dev
```

El contenido está en `docs/site/`, escrito en Markdown. La navegación vive en `.vitepress/config.mts`. Usa enlaces relativos entre páginas y comprueba el sitio con su prefijo `/hiperion/`.

```sh
npm --prefix docs/site exec -- playwright install chromium
npm --prefix docs/site test
```

La versión de VitePress está fijada en el lockfile. Se usa la línea 2 en preview, con Vite actualizado; sus cambios se validan de forma independiente a la aplicación.

[Normas de contribución](https://github.com/0vas/hiperion/blob/main/CONTRIBUTING.md) · [Seguridad](https://github.com/0vas/hiperion/blob/main/SECURITY.md)
