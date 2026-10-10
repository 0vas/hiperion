# Usar el canvas

El chat define el objetivo y realiza el trabajo con sus herramientas. El canvas te permite seguir el proceso y aportar decisiones.

## Encuentra tu siguiente tarea

Selecciona una tarea en la navegación superior y usa **Enfocar tarea**. **Seguir actividad** mantiene cerca el trabajo activo. En Ajustes puedes elegir orientación vertical u horizontal y el tema; los trabajos agrupan pasos que puedes desplegar.

| Señal              | Qué significa                                      |
| ------------------ | -------------------------------------------------- |
| Inicio verde       | Punto de partida                                   |
| Compuerta amarilla | Divide o reúne caminos                             |
| Fin rojo           | Cierre del proceso, no necesariamente un error     |
| Tarea verde        | Completada                                         |
| Tarea azul         | Lista para el agente o en ejecución; lee su estado |
| Tarea ámbar        | Requiere tu intervención                           |
| Tarea roja         | Fallo o rechazo                                    |
| Ruta gris          | Pendiente u omitida, según su trazo                |

Las rutas muestran el avance registrado. La animación no garantiza que el agente siga conectado. El movimiento se reduce si así lo configuras en el sistema.

## Responde lo necesario

Cada formulario debe tener una pregunta concreta. El agente puede usar desplegables, Sí/No, cantidades o texto según el dato. Ninguna elección debe estar aprobada por defecto. La ayuda y los detalles opcionales se despliegan cuando los necesitas.

En **I/O** ves las entradas y salidas; en **Logs**, resúmenes, acciones y observaciones públicas. Se actualizan cuando el agente envía eventos. No son una grabación automática de todas sus herramientas ni de su razonamiento privado.

## Retomar el trabajo

**Espera al agente** significa que la tarea está habilitada y aún no se ha iniciado. Guardar tu respuesta no ejecuta por sí mismo acciones en otra aplicación.

Si el chat está esperando mediante la integración, recibe el cambio y puede seguir en el mismo turno. Si terminó su turno, usa **Copiar continuación** en Hyperion y envía el texto en el chat conectado. Incluye el ID del flujo para recuperar la decisión y continuar sin empezar otro proceso.

Si no avanza, comprueba si está pausado, si falta otra respuesta o si el agente informó un error. Consulta la actividad de la tarea; no vuelvas a aprobar lo mismo ni crees otro flujo para eludir el bloqueo.

## Reintentar

Cuando una tarea falla, revisa su log. Pide al agente reintentar tras corregir la causa. El reintento conserva la evidencia del fallo y permite volver a ejecutar la tarea; no borra el historial ni repite aprobaciones humanas automáticamente.

## Cambiar el plan

Puedes decir en el chat: «Desde esta fase, necesitamos añadir una revisión». El agente puede revisar el trabajo futuro con una explicación. Hyperion conserva lo ya ejecutado y pausa el plan revisado para tu revisión en el canvas. Cambiar el objetivo no debe reescribir el historial.

## Compuertas

- **Exclusiva (×):** elige un camino según la respuesta.
- **Inclusiva (○):** habilita uno o varios caminos que cumplen la condición.
- **Paralela (+):** habilita varios caminos y espera su reunión.

Que dos tareas estén habilitadas no implica que se ejecuten simultáneamente: depende de las capacidades reales del agente.
