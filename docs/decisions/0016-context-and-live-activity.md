# 0016 — Contexto, continuidad y actividad observable

## Criterios de aceptación

- Cada tarea puede consumir contexto tipado y salidas anteriores; el agente y el canvas ven la petición y resultados de sus antecesores completados con procedencia. No se incluyen ramas omitidas ni tareas futuras.
- La aprobación habilita trabajo del agente, sin fingir que despierta el chat. Se ofrece una petición copiable y una instrucción concreta.
- Las rutas muestran etiquetas humanas, conservando condiciones de ejecución.
- Un canal SSE autenticado entrega cambios confirmados; reconectar recupera el estado. Logs e I/O pulsan brevemente solo al recibir registros o valores nuevos, respetando movimiento reducido.
- Los participantes conocidos usan SVG con nombre accesible; los desconocidos conservan una representación genérica.
- Validación: pruebas de dominio, HTTP/SSE, navegador en viewport split, npm run check y regresión Playwright.

## Decisión

Contexto disponible es una proyección de lectura, distinta de las entradas tipadas. Los datos explícitos siguen contratos y validación. El servidor publica snapshots confirmados por SSE con recuperación por snapshot y sondeo de respaldo. La animación confirma recepción, no representa actividad privada ni supone que un agente sigue conectado.
