# Tu primer flujo

Necesitas una herramienta de IA compatible y Hyperion conectado a ella. La conexión se hace una vez; tus siguientes peticiones se escriben en el chat.

<Quickstart />

## Pruébalo antes de instalar

<WorkflowDemo />

## 1. Abre Hyperion

<Downloads />

[Descargar Hyperion Desktop](https://github.com/0vas/hiperion/releases/tag/v2026.10.12.0638).

Elige el instalador para tu equipo: `.dmg` para Mac (Apple Silicon o Intel) y `.exe` para Windows x64. Ábrelo e instala la aplicación. En Mac, mueve Hyperion a **Aplicaciones** antes de conectar tu IA. Esta preview macOS tiene firma ad-hoc, pero no notarización: Apple puede bloquear su apertura. Windows no tiene firma de editor.

### macOS bloquea la app

El aviso «Apple could not verify Hyperion.app is free of malware» aparece porque esta preview no está notarizada. No demuestra por sí mismo que la descarga esté dañada; tampoco equivale a una comprobación de seguridad aprobada por Apple.

Si decides confiar en la copia descargada del repositorio oficial:

1. Mueve **Hyperion.app** a **Aplicaciones** e intenta abrirla una vez.
2. En el aviso, pulsa **Listo / Done**.
3. Abre **Ajustes del Sistema → Privacidad y seguridad**. En Seguridad, busca Hyperion y pulsa **Abrir igualmente**.
4. Confirma la apertura y autentícate si macOS lo solicita.

Esta excepción corresponde a Hyperion. No desactives Gatekeeper para todo el equipo. Si no aparece el botón, el Mac está administrado o el aviso dice que la app está dañada o contiene malware, no fuerces la apertura: consulta la [guía oficial de Apple](https://support.apple.com/en-us/102445) y reporta el texto exacto.

Eliminar este bloqueo en la distribución requiere certificado Developer ID y notarización Apple; todavía están pendientes.

## 2. Conecta tu IA

Al abrir Hyperion, elige **Codex**, **Cursor**, **Claude Desktop**, **Claude Code** o **Antigravity** en el asistente. También puedes acceder desde **Hyperion → Conectar con mi IA**.

El asistente prepara la conexión local. Reinicia tu herramienta de IA y abre un chat nuevo para que cargue la integración. No necesitas Node.js ni editar archivos de configuración para este recorrido con Desktop.

## 3. Pide lo que necesitas

Por ejemplo, desde un chat nuevo:

> Usa Hyperion para preparar una guía de bienvenida a mi proyecto.

::: tip Solo describe el objetivo
No tienes que diseñar el flujo ni explicar cómo usar Hyperion. El agente organiza los pasos y pregunta únicamente por la información que falta.
:::

El agente comparte el enlace a tu flujo. Un chat vacío puede empezar con esa petición; la conexión debe estar instalada.

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

## Peticiones listas para probar

<UseCases />

Elige un caso, copia la petición y pégala en tu herramienta de IA conectada. El agente adapta el plan a tu contexto. Son recorridos esperados, no ejecuciones garantizadas.

::: details Probar desde el código fuente
Para desarrollo, como alternativa a Desktop. Requiere Node.js 22.13 o superior.

```sh
git clone https://github.com/0vas/hiperion.git
cd hiperion
npm ci
npm run build
npm start
```

En otra terminal, conecta tu herramienta una vez:

```sh
npm run hyperion -- setup cursor
# Alternativas: setup codex / setup claude
```

Reinicia esa herramienta, abre un chat nuevo y pega una de las peticiones de arriba. Abre `http://127.0.0.1:4317` para ver el canvas. Este recorrido ejecuta el código de `main`, no el instalador preview anterior.
:::

## Actualizar Desktop

Desde la versión CalVer **2026.10.12.0638 UTC**, abre **Hyperion → Buscar actualizaciones…**. La app consulta GitHub y ofrece el instalador de tu equipo; tú eliges descargarlo. Verifica tamaño y SHA-256 antes de mostrar el archivo para instalar. Puedes cancelar desde **Hyperion → Cancelar descarga**. Tus flujos permanecen en el almacenamiento local.

**La primera migración desde 0.4 o 0.5.1 a CalVer es manual desde esta página**: el actualizador antiguo no reconoce las nuevas etiquetas. La versión pública usa **AAAA.MM.DD.HHMM UTC**, con hora y minuto; el canal Preview se muestra por separado. Las siguientes actualizaciones se comparan cronológicamente.

La versión 0.4.0 necesita una actualización manual. Su bundle macOS tiene una firma incompleta; volver a descargar el mismo instalador no corrige esa firma. La nueva preview sella correctamente el bundle, pero **no está notarizada por Apple**. Una firma ad-hoc no garantiza aceptación por Gatekeeper. Si macOS bloquea la instalación, consulta la [guía de Apple](https://support.apple.com/102445); no desactives la protección global del equipo.

Si falla el servicio local, la nueva app muestra opciones para reintentar, abrir el diagnóstico o buscar actualizaciones. Si el puerto ya lo usa otra versión, debes cerrar esa instancia antes de reintentar; tus ejecuciones no se borran.
