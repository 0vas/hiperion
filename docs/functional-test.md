# Prueba funcional con Codex

## Preparación

Desde la raíz del repositorio:

```sh
npm ci
npm run build
npm start
```

En otra terminal, o desde las herramientas de esta conversación:

```sh
npm run hyperion -- create examples/codex-trial.json
```

El resultado incluye `id` y `url`. Abre esa URL. La instancia local usa `http://127.0.0.1:4317`.

## Participación de la persona

1. Selecciona **Definir tu objetivo**.
2. Escribe una actividad pequeña relacionada con el proyecto y pulsa **Enviar respuesta**.
3. Vuelve al chat de Codex y escribe: «Continúa el flujo de Hyperion RUN_ID». El botón **Continuar en Codex** copia esa petición; no inicia una conversación por su cuenta.
4. Observa cómo Codex registra su revisión y su propuesta. Abre cada nodo para leer resultados e historial.
5. En **Validar la propuesta**, aprueba o rechaza con una explicación.
6. Si apruebas, pide a Codex continuar para realizar la entrega final.

## Trabajo que debe realizar Codex

Lee el estado y la respuesta del usuario mediante la CLI o MCP. Registra el inicio antes de realizar una acción; adjunta resultados reales al completarla. Los dos pasos intermedios admiten concurrencia porque ambos dependen del objetivo. No inventes trabajo paralelo si los ejecutas secuencialmente.

En la aprobación, detente y devuelve la referencia del flujo al usuario. No uses el navegador, credenciales humanas o llamadas directas para aprobar por él. La aprobación autoriza solo el alcance descrito en la propuesta.

## Evidencia de validación

- La suite del motor/API/SQLite/MCP comprueba estados, dependencias, roles, revisiones, ciclos, idempotencia, persistencia, límites de entrada y espera acotada.
- Playwright crea un flujo con una credencial de agente de prueba y realiza la interacción humana **en una instancia de pruebas separada**. Verifica respuesta, aprobación, recarga, continuación y finalización.
- La misma suite comprueba la vista estrecha, el contraste WCAG AA mediante axe y el manejo del foco en la ayuda.
- La ejecución personal creada desde esta conversación es distinta de las pruebas automatizadas. Permanece esperando una respuesta real del usuario hasta que este la envíe.

La integración utilizada en esta conversación es la CLI HTTP. MCP se valida con un cliente del SDK mediante stdio; su configuración en una nueva sesión de Codex es opcional y se explica en [integration.md](integration.md).

## Resultado de la verificación del primer incremento

- `npm test`: 15 pruebas aprobadas.
- Suite del motor, HTTP, SQLite y MCP ejecutada además con Node 22 y Node 24: 15 aprobadas en cada versión.
- `npm run test:e2e`: 5 pruebas aprobadas en Chromium. Incluye un recorrido completo con respuesta humana, aprobación, recarga y finalización; viewport estrecho; axe WCAG AA; foco del diálogo; y rechazo visual de un enlace a una ejecución inexistente.
- `npm run typecheck`, `npm run build` y `npm run format:check`: correctos.
- `npm audit --audit-level=high`: 0 vulnerabilidades reportadas en el momento de la comprobación.
- Inspección visual de capturas de escritorio y móvil, revisión de enlaces locales y XML/SVG de arquitectura.
- CI configurado en GitHub Actions; no se ha enviado la rama al remoto ni ejecutado CI remoto.

Los ciclos TDD detectaron fallos antes de sus correcciones: módulos aún inexistentes, nodos que no recibían clics, contraste insuficiente, espera con argumentos inválidos y selección incorrecta ante enlaces inexistentes. La validación automática de accesibilidad cubre las pantallas probadas; no es una auditoría exhaustiva del producto.

## Incremento: petición original y múltiples clientes (2026-10-08)

El [manual de uso](manual-uso.md) añade un caso completo generado desde una petición, con elección manual, dos revisiones independientes y aprobación previa a la entrega. El ejemplo reproducible es `examples/first-contribution.plan.json`. La instancia creada desde Codex queda esperando la elección humana; no se ha simulado esa respuesta.

- `npm run check`: correcto; 20 pruebas de lógica, persistencia, HTTP, credenciales y MCP aprobadas, además de tipos, build y formato.
- `npm run test:e2e`: 6 pruebas aprobadas. La nueva prueba compara posiciones de nodos para verificar dependencias verticales y ramas en el mismo nivel; también comprueba la petición original visible.
- El mismo contrato MCP se ejecuta con identidades Codex, Claude y Cursor usando el cliente del SDK. La API comprueba además un cliente genérico, separación de autoridad y registro de credenciales con el servidor en marcha. No se afirma haber ejecutado Claude o Cursor nativos.
- La generación de configuración comprueba rutas absolutas y ausencia de secretos. Las credenciales existentes se conservan.
- La instancia local actualizada muestra los cinco nodos del nuevo caso y la petición original, sin errores JavaScript en la comprobación de navegador.

El ciclo TDD observó primero el fallo por la operación de registro aún inexistente, después implementó el registro y sus adaptadores, y terminó verificando API, MCP e interfaz.
