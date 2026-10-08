# Hyperion: del chat al flujo

**Tú describes la actividad en el chat. La IA conecta Hyperion, crea el plan y ejecuta sus pasos. Tú sigues el avance y decides en el canvas.**

## Invocarlo desde esta conversación

Escribe, por ejemplo:

> Usa Hyperion para preparar una guía de bienvenida a mi proyecto. Organiza el trabajo por trabajos y pasos. Pregúntame a quién va dirigida y espera mi aprobación antes de darla por terminada.

Eso es todo. En este entorno la conexión ya está preparada: no tienes que instalar nada, abrir una terminal ni escribir comandos. Codex crea un flujo específico y te entrega su enlace.

Si solo dices «Quiero usar Hyperion», el agente te preguntará qué actividad quieres realizar. El plan nace de tu respuesta.

## Qué pasa después

1. **Abre el enlace.** «Petición original» conserva lo que pediste.
2. **Revisa el plan.** «Ver trabajos» resume las fases. Pulsa un trabajo para desplegar los pasos en el canvas. Cada paso conserva su responsable, estado, datos y logs.
3. **Enfoca el trabajo.** Selecciona un paso en «Ir a tarea» y activa «Seguir actividad». La vista acompaña el avance; al arrastrar o cambiar el zoom puedes explorar libremente.
4. **Decide cuando diga «Tu turno».** Abre el paso: verás qué se te pregunta, por qué hace falta y qué sucederá después. Elige los valores y pulsa «Guardar elección», o revisa el resultado y aprueba/rechaza.
5. **Vuelve a este chat y escribe:** «Continúa mi flujo de Hyperion». Codex leerá tu decisión y retomará los pasos habilitados del mismo flujo.

Si tienes varios flujos, pulsa «Continuar en Codex» dentro del que quieres retomar y pega aquí el texto copiado. Ese botón copia la petición; no envía mensajes por ti.

## Un ejemplo completo

**Tú, aquí:** «Usa Hyperion para preparar mi guía de bienvenida».

**Codex:** conecta el canvas, crea los trabajos «Definir la guía», «Redactar» y «Revisar», con sus pasos, y comparte el enlace.

**Hyperion, en tu turno:** «¿La guía es para personas sin experiencia técnica?». Explica que esta elección adapta el vocabulario. Seleccionas Sí o No y guardas.

**Tú, aquí:** «Continúa mi flujo de Hyperion».

**Codex:** lee la elección, redacta la guía, registra el resultado y deja la revisión final para ti. Apruebas solo después de leerla.

Los títulos y decisiones se generan para tu actividad; este ejemplo no es una plantilla obligatoria.

## Controles útiles

| Control                    | Uso                                                          |
| -------------------------- | ------------------------------------------------------------ |
| Ver trabajos / Ver pasos   | Alternar resumen y detalle del mismo proceso                 |
| Ir a tarea / Enfocar tarea | Centrar un paso, incluso si ya terminó                       |
| Seguir actividad           | Acompañar la tarea que requiere atención                     |
| Vista general              | Volver al flujo completo                                     |
| I/O                        | Ver lo que recibe y entrega un paso                          |
| Logs                       | Consultar acciones y resultados que registró el agente       |
| Actividad                  | Revisar el historial del proceso                             |
| Ajustes                    | Elegir tema, reducir movimiento, vista y seguimiento inicial |
| Pausar                     | Evitar que se inicien nuevas tareas hasta reanudar           |

Los ajustes se guardan en este navegador. No alteran tus decisiones ni conceden permisos al agente. Escape cierra un popup sin responder.

## Qué significa el estado

**En espera:** falta un paso previo. **Listo:** la IA puede ejecutarlo. **En curso:** la IA registró que empezó. **Tu turno:** necesita tu decisión. **Completado:** hay un resultado. **Omitido:** esa rama no fue elegida. **Falló:** abre los logs y pide al agente que lo revise.

Inicio y fin marcan los límites. Las compuertas indican todas las ramas (`+`), una sola (`X`) o las que cumplen una condición (`○`). El agente las usa solo cuando aportan sentido al proceso.

## Codex, Cursor y Claude

La misma petición funciona en un harness que tenga Hyperion conectado. Hyperion acepta skills, MCP o su API; el flujo no depende de una marca de IA. Esta conversación de Codex ya dispone de la skill.

En otra herramienta puedes pedir: «Conecta Hyperion y úsalo para [actividad]». Si aún no tiene acceso a Hyperion, necesitará que su integración esté habilitada; reconocer el nombre no instala una aplicación por sí solo. La [guía de conexión para integradores](conexion.md) contiene esa configuración, separada del uso diario.

En esta versión, al guardar una decisión debes volver al chat para continuar. El canvas no despierta conversaciones cerradas ni ejecuta por sí mismo las herramientas de la IA.

## Leer los colores y las flechas

- **Inicio verde:** círculo de borde fino. **Compuertas amarillas:** rombos con +, X u ○. **Fin rojo:** círculo de borde grueso. Estos colores identifican el símbolo, no su estado.
- **Verde:** paso completado y ruta recorrida.
- **Azul:** «Listo» espera al agente; «En curso» indica que el agente inició la tarea.
- **Ámbar:** el proceso espera tu intervención o está en pausa. La etiqueta distingue ambos casos.
- **Rojo en tareas o conexiones:** error o rechazo que requiere revisión. El círculo rojo de fin no es un error.
- **Gris discontinuo:** ruta pendiente; el punteado más tenue identifica una rama omitida.

Pulsa **Más opciones → Colores del flujo** para abrir la leyenda. Las cajas usan iconos SVG para distinguir agente, persona y aprobación; mantienen datos y logs a un clic. El color siempre va acompañado de texto o símbolos.

Las conexiones SVG muestran una corriente: una línea continua con un reflejo que avanza desde lo hecho hasta la tarea disponible o que espera tu respuesta. No circula por ramas pendientes u omitidas. Se detiene al terminar, pausar, cancelar, perder conexión o activar movimiento reducido; no indica que un agente siga vivo fuera de Hyperion. En la vista de trabajos, los pasos internos pueden seguir ejecutándose aunque la flecha de entrada al trabajo ya figure como recorrida.

## Junto al chat o en una ventana independiente

En una ventana dividida, la cabecera muestra el flujo y la fila inferior permite elegir y enfocar una tarea. El canvas ocupa el espacio central; zoom y «Tu turno» quedan abajo. Los iconos muestran su nombre al mantener el cursor encima.

**Más opciones (⋯)** reúne la petición original, actividad, vista de trabajos/pasos, continuación y pausa. **Ajustes** permanece accesible en la cabecera. Al ampliar la ventana, las acciones del flujo también aparecen en la barra inferior.

Para trabajar fuera del panel del chat, pulsa **Más opciones → Abrir en ventana**. Se abre el mismo flujo en una ventana web independiente que puedes colocar junto a Codex, Cursor o Claude. No requiere comandos. Si el navegador bloquea la apertura, permite ventanas para Hyperion y vuelve a pulsar el botón. Esta opción abre otra ventana del navegador. Para el cliente de escritorio, usa la opción siguiente.

## Elegir escritorio o split desde el chat

Puedes decir:

> Usa Hyperion en split para preparar mi guía.

> Abre este mismo flujo de Hyperion en escritorio.

> Vuelve a mostrarlo junto al chat.

El agente mantiene el mismo flujo: decisiones y resultados aparecen en ambas vistas. **Split** usa el enlace web. **Escritorio** abre Hyperion Desktop después de instalarlo y abrirlo una vez. El usuario no tiene que copiar comandos ni configurar puertos. La herramienta de IA sí necesita la integración local de Hyperion, como en el uso web.

Los instaladores son **DMG para macOS** y **EXE para Windows**. Se generaron DMG para Apple Silicon e Intel y EXE x64 para Windows; se probó la aplicación en Apple Silicon. Windows e Intel aún requieren una prueba en su plataforma. El repositorio contiene la compilación reproducible; la distribución pública firmada aún está pendiente. El DMG local es de desarrollo y no está notarizado.

## Orientación, decisiones y reintentos

- **Horizontal / vertical:** pulsa la flecha de dirección junto al selector de tareas, o cambia **Ajustes → Dirección**. Se conserva tu preferencia. «Vista general» muestra el proceso completo; «Enfocar paso actual» vuelve al trabajo pendiente.
- **Compuertas:** los rombos SVG usan **+** (todas las ramas), **X** (una) y **○** (una o más). Abre **Más opciones → Colores del flujo** para ver sus reglas. Solo aparecen las compuertas que el agente incluyó en tu proceso.
- **Animación:** la corriente avanza por las rutas alcanzadas y llega hasta el punto de espera. Las rutas pendientes no se mueven. Funciona en horizontal y vertical, en split y escritorio; respeta el movimiento reducido.
- **Tu lista:** cada pregunta indica si está resuelta. Selecciona Sí o No, completa los datos solicitados y guarda al terminar. Marcar No también resuelve la pregunta; no hay respuestas predeterminadas.
- **Reintentar:** aparece en la caja y el detalle de una tarea que falló. Conserva el error en el historial y habilita otro intento. Después pide al chat «Continúa mi flujo de Hyperion». El botón no ejecuta herramientas por su cuenta.
