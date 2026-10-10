# Alcance y límites

## Disponible

Canvas vertical u horizontal, trabajos y pasos, decisiones humanas, entradas y salidas tipadas, logs enviados por el agente, reintentos y revisión del trabajo futuro. Integraciones locales mediante MCP o skill; Desktop incluye su runtime.

El perfil `bpmn-lite` admite inicio, fin y compuertas exclusivas, inclusivas y paralelas con divisiones y reuniones estructuradas.

## Lo que aún no hace

- Despertar de forma universal un chat que terminó su turno. La espera cooperativa puede recibir respuestas durante un turno activo.
- Ejecutar herramientas por sí mismo o interceptar todas las llamadas del agente.
- Importar o exportar BPMN XML ni ofrecer BPMN completo: no hay ciclos, temporizadores, compensaciones ni mensajes entre pools.
- Ofrecer un servicio remoto multiusuario, instalación universal desde una frase o conexión entre equipos.
- Publicar cambios o completar decisiones humanas sin la intervención y autorización correspondientes.

## Distribución actual

La versión descargable `v0.4.0-preview.1` incluye paquetes para Mac Apple Silicon, Mac Intel y Windows x64. Los builds y pruebas de runtime se ejecutan en esos sistemas. No equivale a verificar todos los entornos de cada proveedor.

Los instaladores son de prueba y aún no cuentan con firma/notarización. Los cambios nuevos de `main`, como los desplegables declarados en el plan, estarán en los siguientes instaladores; la documentación de este sitio sigue `main`.

## Privacidad

El proceso y sus eventos se guardan en el equipo que ejecuta Hyperion. El proveedor de IA sigue aplicando sus propias condiciones al contenido que recibe. Los logs pueden contener información de tu trabajo: comparte solo lo necesario y nunca credenciales.

GitHub Pages publica esta documentación estática. No recibe ni ejecuta tus flujos, no hospeda SQLite y no sustituye la aplicación local.
