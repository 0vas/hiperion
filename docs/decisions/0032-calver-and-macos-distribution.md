# 0032 — CalVer y estado explícito de distribución macOS

## Decisión

La versión pública de Hyperion pasa a `AAAA.MM.DD.HHMM` en UTC. `src/release.json` es la fuente de verdad, con canal preview/estable separado. El minuto se fija al preparar la release y no cambia entre plataformas o reintentos. No reemplazar assets de una release publicada: una corrección obtiene otro minuto.

El runtime y los nombres de artefactos usan CalVer. Npm necesita tres componentes: `AAAA.M.D-build.<minutos desde medianoche>` es una codificación técnica, no SemVer del producto. La versión nativa corta usa fecha; el build nativo usa días desde 2020 (base 1), hora y minuto, dentro de los límites numéricos de Apple/Windows. La conversión rechaza fechas fuera del rango nativo. Ejecutar `npm run release:sync` después de editar la metadata y verificar la coherencia mediante tests.

El comparador prioriza CalVer frente al legado, valida fechas reales, ordena numéricamente y respeta canales. La aplicación 0.5.1 ya publicada no reconoce las etiquetas nuevas; requiere una primera migración manual. No publicar una segunda etiqueta SemVer para ocultar esa limitación.

## Distribución

La integridad ad-hoc no equivale a aceptación por Gatekeeper. El aviso de Apple de que no puede verificar malware es esperable en las previews sin notarizar. La web debe explicarlo junto a las descargas y ofrecer el procedimiento oficial de excepción individual. No eliminar cuarentena ni desactivar controles globalmente.

El workflow permite solicitar distribución notarizada: falla sin credenciales y exige validación de notarización/Gatekeeper. Las previews se etiquetan explícitamente. Certificados y contraseñas pertenecen a secretos de CI, nunca al repositorio ni al chat.

## Evidencia

Pruebas de comparación por minuto, cambio de día/año, fecha inválida, canal, integridad de descargas, coherencia de metadata y rechazo de distribución notarizada sin credenciales. La ausencia de cuenta/certificado Apple sigue siendo una limitación externa, no un fallo que resuelva CalVer.
