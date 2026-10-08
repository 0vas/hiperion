# Manual de uso de Hyperion

**Pide en tu chat. Sigue el trabajo en el canvas. Decide cuando sea tu turno.**

La conversación permanece en Codex, Cursor, Claude Desktop u otro harness conectado. Su agente genera el plan y ejecuta herramientas; Hyperion muestra el proceso, guarda sus avances y recoge tus decisiones.

## Uso diario

1. **Pide:** «Usa Hyperion para [actividad]. Muéstrame el plan y pídeme aprobación antes de [acción]».
2. **Abre** el enlace que devuelve el agente. Cada caja es una tarea; las líneas y compuertas indican el orden.
3. **Enfoca:** elige una tarea en **Ir a tarea**, o abre su popup y pulsa **Enfocar tarea**.
4. **Sigue:** activa **Seguir actividad**. La vista acompaña la tarea que requiere atención.
5. **Participa:** cuando aparezca **Tu turno**, responde, entrega el resultado manual o aprueba/rechaza.
6. **Continúa:** pulsa **Continuar en [herramienta]** y pega la petición copiada en el mismo chat.

No necesitas escribir JSON. El agente crea el flujo desde tu petición.

## Controles del canvas

| Control                             | Para qué sirve                                        |
| ----------------------------------- | ----------------------------------------------------- |
| **Ir a tarea**                      | Elegir y centrar cualquier tarea, incluso completada  |
| **Tarea actual** (icono de enfoque) | Ir al paso que requiere atención                      |
| **Seguir actividad**                | Avanzar el foco conforme cambia el trabajo            |
| **Vista general**                   | Ver todo el flujo y dejar de seguir                   |
| **Abrir tarea** ↗                   | Ver instrucciones, estado y acciones                  |
| **Datos** / **I/O**                 | Revisar entradas, salidas, tipos y valores            |
| **Logs**                            | Leer acciones, observaciones y resultados registrados |
| **Petición original**               | Consultar el contexto que originó el plan             |
| **Actividad**                       | Ver el historial completo                             |
| **Guía de uso** (libro)             | Abrir esta guía breve dentro del canvas               |

**El seguimiento controla la vista.** No inicia tareas ni despierta al agente. Prioriza fallos, tu intervención, trabajo en curso y tareas listas. Conserva el foco entre ramas de igual prioridad. Al terminar, se detiene en la última tarea.

Arrastrar, cambiar el zoom, elegir una tarea o pulsar **Vista general** vuelve a **Vista libre**. Mientras revisas un popup, el flujo está pausado o no hay conexión, el seguimiento no mueve la cámara. Cierra el popup con **Escape** para volver sin enviar una decisión.

## Qué hacer según el estado

| Estado         | Siguiente acción                     |
| -------------- | ------------------------------------ |
| **En espera**  | Revisar las dependencias             |
| **Lista**      | Pedir al agente que continúe         |
| **En curso**   | Consultar los logs                   |
| **Tu turno**   | Responder o decidir en el popup      |
| **Falló**      | Revisar el error con el agente       |
| **Completada** | Consultar el resultado y las salidas |
| **Omitida**    | Rama no elegida por la compuerta     |

Si el agente terminó su turno, vuelve al mismo chat: «Continúa el flujo de Hyperion [ID]». Tu respuesta queda guardada. La reanudación automática depende del harness y no está implementada en esta edición.

## Conectar tu herramienta

La configuración se realiza una vez. Después, cada actividad comienza desde el chat.

| Herramienta local                        | Conexión                           |
| ---------------------------------------- | ---------------------------------- |
| Codex, Cursor o Claude Code con terminal | Skill portable: `hyperion install` |
| Claude Desktop                           | Servidor MCP local                 |
| Otro harness                             | Skill con terminal, MCP o API HTTP |

En este checkout: `npm run hyperion -- install`. Recarga las skills o abre una sesión nueva. Para Claude Desktop, el paquete instalable y otras opciones, consulta [Instalar y conectar Hyperion](conexion.md).

## Prueba rápida

En el harness escribe:

> Usa Hyperion para revisar este repositorio. Pídeme si quiero revisar documentación o código. Muéstrame los pasos, registra los resultados y pide mi aprobación final.

Abre el enlace, activa **Seguir actividad**, responde en **Tu turno** y vuelve al chat para continuar. Revisa **Datos** y **Logs** antes de aprobar.

[Contrato de procesos e I/O](process-contract.md) · [Pruebas y límites verificados](functional-test.md)
