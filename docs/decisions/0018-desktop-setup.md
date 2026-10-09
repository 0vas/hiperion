# ADR 0018: conexión local desde Desktop

Estado: aceptado.

## Problema y criterios

La instalación dependía de terminal, CLI del proveedor o edición manual de JSON. «Conectar con mi IA» solo instalaba una skill y no resolvía Claude Desktop.

- El usuario debe elegir su aplicación una vez, reiniciarla y describir su objetivo en un chat nuevo.
- El runtime empaquetado debe iniciar MCP sin Node ni CLI de proveedor instaladas.
- Se deben conservar preferencias y servidores existentes, respaldar archivos modificados, tolerar repetición y rechazar conflictos.
- Split y Desktop deben conservar el mismo servicio, incluidos puertos personalizados.

## Decisión

Asistente nativo en el primer arranque sin flujo, recuperable desde el menú. Codex, Cursor y Claude Desktop reciben la configuración MCP local de usuario. Claude Code recibe su skill administrada en su ubicación propia. La integración no modifica políticas de aprobación del cliente ni instala capacidades en agentes remotos.

Para Codex se analiza TOML antes de añadir una tabla, conservando texto y comentarios originales. Una estructura incompatible se rechaza sin escribir. JSON conserva otras propiedades; las escrituras usan un temporal y reemplazo, con copia previa si había archivo. Una conexión Hyperion distinta requiere resolver el conflicto explícitamente. Las rutas son absolutas y las credenciales no se copian a la configuración.

Electron se usa con `ELECTRON_RUN_AS_NODE=1` para los procesos MCP. El asistente recibe el servicio seleccionado por Desktop, sin asumir el puerto por defecto. La confirmación dice «configurada», no «conectada»: solo el cliente puede confirmar que ha cargado sus herramientas.

## Verificación y límites

Pruebas primero: configuración inexistente, formatos válidos, conflictos, repetición, respaldo, preservación, rutas Windows, cancelación y errores del asistente. La prueba Desktop activa su menú real y verifica el archivo en un usuario aislado. La prueba empaquetada inicia los tres adaptadores MCP usando exactamente las configuraciones generadas y realiza handshake/listado de herramientas y flujos.

Los instaladores se construyen en GitHub Actions para macOS arm64/x64 y Windows x64. Se distribuyen como artefactos de desarrollo; firma/notarización y publicación estable quedan pendientes. El protocolo automatizado no equivale a una conversación nativa verificada en cada aplicación de IA.

Referencias: [Codex MCP](https://developers.openai.com/codex/mcp), [Cursor MCP](https://prod.cursor.com/docs/mcp), [Claude Desktop MCP](https://modelcontextprotocol.io/docs/develop/connect-local-servers).
