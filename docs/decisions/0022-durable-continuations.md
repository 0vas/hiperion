# ADR 0022 — Reanudación durable independiente del harness

Estado: aceptada para el núcleo 0.5.0. Conectores nativos de proveedor pendientes.

## Problema y criterios

La espera de ADR 0021 depende de una llamada activa. El usuario necesita guardar su decisión y activar otro turno sin escribir de nuevo. La solución debe funcionar con cualquier identidad, sobrevivir a reinicios y evitar repetir una entrega incierta. Crear un plan no autoriza que un agente suplante decisiones humanas.

Criterios previos a la implementación: transacción compartida entre respuesta y outbox; acceso solo del coordinador; rechazo de revisión obsoleta; una entrega por relevo; recuperación tras reinicio; pausa/cancelación; retry tras fallo verificado; prueba HTTP y navegador sin long poll de un modelo. La primera ejecución de los tests falló por ausencia de `Store.continuations` y del worker.

## Decisión

Mantener el motor independiente del proveedor. Incorporar un contrato de suspensión con identidad, sesión, alcance y capacidades; persistir bindings y solicitudes en SQLite. `Store` encola dentro de la misma transacción de snapshot/recibo. El worker de IO externo toma leases y delega el turno al conector instalado. UI recibe la proyección por SSE, sin referencias privadas de sesión ni tokens de lease.

El vencimiento de cinco minutos pasa a incertidumbre y requiere consultar el proveedor. No es una orden de repetir trabajo. Aceptar la entrega y completar la tarea son hechos distintos. Cada nueva fase humana requiere armar otro checkpoint. La espera cooperativa sigue disponible cuando no hay conector.

## Consecuencias

El contrato y sus pruebas aceptan Codex, ChatGPT, Claude, Claude Code, Cursor, Hermes y cualquier otro ID. No se deduce capacidad de reanudación del nombre. Integraciones nativas deben probar deduplicación, sesión y permisos; ChatGPT requiere transporte remoto y Claude Desktop no tiene una vía de wakeup certificada aquí. No se incluye un supervisor de procesos ni servicio remoto en este incremento.

Las capacidades son declaradas por un integrador confiable; no certifican conexión. El worker genérico consulta cada segundo sin tokens de modelo. Una pausa posterior al despacho puede coincidir con actividad externa: el conector debe reconciliarla. El dominio sigue rechazando comandos incompatibles con el estado actual y los intentos obsoletos.

## Validación

Tests de cola con SQLite reabierta, HTTP con roles, fallos de transporte y prueba de navegador usando un conector sintético. Ver [cobertura y contrato](../continuacion-agnostica.md). Las pruebas de aplicaciones nativas y el despliegue remoto siguen pendientes; no se equiparan a pruebas de protocolo.
