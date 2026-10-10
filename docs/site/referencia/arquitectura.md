# Arquitectura

Hyperion separa el estado del proceso de la herramienta que ejecuta cada tarea. Su núcleo no depende de Codex, Claude, Cursor ni de Olimpo.

## Responsabilidades

| Componente             | Responsabilidad                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Agente externo         | Traducir la petición a un plan, ejecutar herramientas y registrar resultados reales |
| Adaptadores MCP y CLI  | Conectar el agente con el mismo contrato local                                      |
| Motor de dominio       | Validar dependencias, decisiones, compuertas, datos y revisiones                    |
| Servicio HTTP y SQLite | Persistir el proceso y transmitir cambios al canvas mediante SSE                    |
| Canvas React           | Mostrar el flujo y recoger decisiones humanas                                       |
| Desktop Electron       | Ejecutar el servicio local y presentar el canvas y la configuración                 |

## Vista ArchiMate

Esta vista describe los componentes implementados y sus relaciones. El formato de ejecución del proceso es un perfil BPMN simplificado, separado de la notación arquitectónica.

![Vista ArchiMate de los componentes implementados en Hyperion](../../architecture/implemented.svg)

[Modelo fuente y otras vistas](https://github.com/0vas/hiperion/tree/main/docs/architecture).

## Del chat al resultado

1. El agente crea el plan desde la petición y comparte su enlace.
2. El motor calcula las tareas habilitadas y sus entradas.
3. El agente inicia tareas, ejecuta acciones con sus herramientas y envía evidencia.
4. El usuario responde o aprueba desde el canvas.
5. El agente lee el cambio, retoma el trabajo y registra el resultado.

El servicio no lanza un agente en segundo plano. La actualización en vivo del canvas y la continuidad de una conversación son capacidades diferentes.

## Datos y evolución

Cada tarea declara entradas y salidas tipadas. Las entradas pueden proceder del contexto, de un valor literal o de la salida de una tarea anterior. El servidor valida los valores, incluidas las listas de opciones permitidas.

Las operaciones usan identificadores para evitar duplicados en reintentos de transporte. Las revisiones evitan guardar decisiones sobre un estado desactualizado. Un cambio de plan conserva el historial y requiere revisión humana antes de continuar.

[Contrato de procesos](https://github.com/0vas/hiperion/blob/main/docs/process-contract.md) · [Decisiones de arquitectura](https://github.com/0vas/hiperion/tree/main/docs/decisions)
