# Hyperion Desktop

Electron aloja el mismo canvas del navegador y usa el mismo servicio HTTP local autenticado. El proceso del chat conserva la ejecución: Desktop presenta decisiones y resultados. El usuario elige split/escritorio en la conversación; el adaptador `open RUN_ID desktop` lanza la instalación registrada en su primer arranque.

La [preview descargable](https://github.com/0vas/hiperion/releases/tag/v0.4.0-preview.1) incluye instaladores para macOS Apple Silicon/Intel y Windows x64.

## Desarrollo y distribución

- `npm ci` y `npm run desktop` abren el cliente de desarrollo.
- `npm run test:desktop` prueba un servicio aislado: decisión en split, reflejo en Desktop, ejecución del agente y resultado en ambos.
- `npm run desktop:dist -- --mac` genera DMG; `--win` genera instaladores NSIS EXE.
- `HYPERION_DESKTOP_EXECUTABLE=/ruta/al/ejecutable npm run test:desktop` ejecuta la prueba sobre una aplicación empaquetada.
- El workflow **Desktop installers**, manual y automático ante cambios de Desktop, adaptadores o dependencias, compila en macOS y Windows y guarda artefactos descargables. No publica automáticamente.

Los binarios pertenecen a GitHub Releases, no al historial Git. `release/` está ignorado. Para distribución pública, configurar firma/notarización macOS y firma Windows. No se incorporan certificados al repositorio. El build local sin esas identidades es un artefacto de desarrollo.

## Límites

El renderizador tiene sandbox, aislamiento de contexto y Node deshabilitado; navegación y ventanas se limitan al origen local autenticado. No se permite abrir URLs remotas desde el canvas. La aplicación empaqueta archivos sin ASAR para que su proceso Node independiente pueda servir los assets y sobrevivir al cierre de la ventana. No hay bridge IPC de filesystem expuesto al renderizador.

Si otro servicio ocupa el puerto o las credenciales no coinciden, la aplicación informa del error; no toma control de esa instancia. Para apuntar a otro servicio hay que cerrar la ventana actual. El servidor continúa al cerrar Desktop para que split y el chat conserven acceso.

Referencias de implementación: [aislamiento en Electron](https://www.electronjs.org/docs/latest/tutorial/security), [runtime Node integrado](https://www.electronjs.org/docs/latest/api/environment-variables), [DMG](https://www.electron.build/v26/docs/dmg/) y [NSIS](https://www.electron.build/docs/nsis/).

El servicio predeterminado publica su ubicación local (sin tokens) en `~/.hyperion/workspace.json`, de modo que abrir Desktop desde su icono reutiliza la instancia iniciada por el chat. Los puertos personalizados se seleccionan mediante el adaptador, pasando URL y directorio explícitos. **Hyperion → Conectar con mi IA** abre el mismo asistente del primer arranque: Codex, Cursor y Claude Desktop reciben configuración MCP; Claude Code recibe su skill. Se usa el runtime empaquetado con `ELECTRON_RUN_AS_NODE`, sin instalar Node ni depender de CLI de proveedor. Los archivos existentes tienen respaldo y las conexiones ajenas se conservan. La configuración no equivale a una sesión MCP ya conectada: el usuario reinicia su aplicación.

Antigravity también está disponible en el asistente de `main`: configura `~/.gemini/config/mcp_config.json` con el runtime incluido, respaldo y rechazo de conflictos. Esta opción no está en los instaladores publicados 0.4.0-preview.1. La prueba del runtime empaquetado incluye su identidad MCP; eso no certifica una conversación en el cliente Google.

## Firma y arranque (0.5.1-preview.1)

La preview 0.4.0 tiene una firma macOS incompleta: `codesign --verify --deep --strict` falla incluso en el DMG original. La suma SHA-256 del archivo descargado sí coincide. No debe describirse como una simple advertencia de descarga ni recomendarse desactivar Gatekeeper.

`desktop/builder.config.cjs` sella ahora las previews macOS con firma ad-hoc. CI verifica el bundle antes de probarlo y subir artefactos. Eso comprueba integridad; **no acredita un desarrollador ni sustituye la notarización de Apple**. Para distribución identificada, configurar secretos `CSC_LINK` (Developer ID Application), `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` y `APPLE_TEAM_ID` en GitHub. Nunca incluirlos en el repositorio o en el chat. Con certificado configurado se activa hardened runtime y notarización, y CI exige `stapler validate` y `spctl --assess`. Sin esas credenciales solo se genera una preview ad-hoc; no se afirma que Gatekeeper la acepte.

Si el servicio no inicia, Desktop mantiene un diálogo con Reintentar, Ver diagnóstico, Buscar actualizaciones y Salir. El diagnóstico se guarda en la carpeta de logs de la aplicación. No borra ejecuciones ni detiene procesos ajenos; un puerto ocupado o una versión incompatible se informa explícitamente.

## Actualizaciones desde la aplicación

**Hyperion → Buscar actualizaciones…** consulta las últimas 30 releases públicas de `0vas/hyperion`, excluye borradores y elige una versión superior con instalador para el sistema y arquitectura actuales. Las versiones preview también reciben previews; una versión estable solo recibe estables. Al abrir Desktop empaquetado se hace una comprobación después del asistente inicial. Fallos de red en esa comprobación automática no interrumpen el trabajo; una comprobación manual muestra el error.

Al aceptar Descargar actualización, el usuario elige dónde guardarla. La app muestra progreso, permite **Cancelar descarga** y valida tamaño y SHA-256 publicados por GitHub antes de reemplazar el archivo de destino. Los archivos parciales se eliminan si falla la descarga. Solo se aceptan assets del repositorio oficial. El digest comprueba integridad, no notarización. Se muestra el instalador en Finder/Explorer; no se ejecuta ni se instala silenciosamente. La versión 0.4.0 no dispone de este menú y necesita la primera actualización manual.

La marca canónica es `docs/site/public/brand/hyperion-titan.png`; Desktop y el canvas usan copias idénticas comprobadas por `tests/desktop-brand.test.ts`. Después de cambiar la marca hay que regenerar instaladores; modificar Pages no modifica una release anterior.
