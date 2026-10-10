# Tu primer flujo

Necesitas una herramienta de IA compatible y Hyperion conectado a ella. La conexión se hace una vez; tus siguientes peticiones se escriben en el chat.

## 1. Abre Hyperion

[Descargar Hyperion Desktop](https://github.com/0vas/hiperion/releases/tag/v0.4.0-preview.1).

Elige el instalador para tu equipo: `.dmg` para Mac (Apple Silicon o Intel) y `.exe` para Windows x64. Ábrelo e instala la aplicación. En Mac, mueve Hyperion a **Aplicaciones** antes de conectar tu IA. Esta preview aún no está firmada ni notarizada: el sistema puede mostrar un aviso de editor no verificado.

## 2. Conecta tu IA

Al abrir Hyperion, elige **Codex**, **Cursor**, **Claude Desktop** o **Claude Code** en el asistente. También puedes acceder desde **Hyperion → Conectar con mi IA**.

El asistente prepara la conexión local. Reinicia tu herramienta de IA y abre un chat nuevo para que cargue la integración. No necesitas Node.js ni editar archivos de configuración para este recorrido con Desktop.

## 3. Pide lo que necesitas

Por ejemplo, desde un chat nuevo:

> Usa Hyperion para preparar una guía de bienvenida a mi proyecto.

No hace falta explicar cómo crear el flujo. El agente debe preparar el plan, compartir su enlace y pedir solo la información que falta. Un chat vacío puede empezar con esa petición; la conexión debe estar instalada.

También puedes indicar dónde verlo:

> Usa Hyperion en una ventana de escritorio para organizar mi actividad.

O pedir verlo junto al chat. La disponibilidad de una vista dividida depende de tu herramienta; el enlace abre el mismo flujo en el navegador.

## 4. Participa en el canvas

Abre la tarea marcada **Tu turno**, responde y guarda. Las opciones conocidas aparecen como desplegables en los planes que las declaran; las preguntas abiertas admiten texto.

Si el agente sigue esperando tu respuesta, puede retomar el trabajo en ese mismo turno. Si el chat ya terminó, pulsa **Copiar continuación** y envía ese mensaje en el chat. La decisión ya quedó guardada: no tienes que escribirla otra vez.

## Comprueba tu primera prueba

- El flujo refleja tu petición y muestra el responsable de cada tarea.
- Los datos que introduces aparecen en I/O y llegan a las tareas siguientes.
- El borrador y sus avances reales se registran en el flujo.
- Puedes revisar el resultado y volver al chat para pedir cambios.

Preparar una guía no implica publicarla. La integración debe respetar el alcance de tu petición.

[Aprende a usar el canvas](./usar-el-flujo.md) o consulta [problemas de conexión](./integraciones.md).
