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
