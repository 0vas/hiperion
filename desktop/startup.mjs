/** Keep recovery actions available when the local service cannot start. */
export async function recoverStartup({
  t = (message, values = {}) =>
    message.replace(/\{(\d+)\}/g, (match, key) =>
      values[key] === undefined ? match : String(values[key]),
    ),
  start,
  dialog,
  showLogs,
  checkUpdates,
  record,
}) {
  for (;;) {
    try {
      await start();
      return true;
    } catch (error) {
      await record(error);
      let retry = false;
      while (!retry) {
        const { response } = await dialog.showMessageBox({
          type: 'error',
          title: t('Hyperion no pudo iniciar'),
          message: t('No se pudo abrir el servicio local'),
          detail: t(
            '{0}\n\nTus flujos no se han borrado. Puedes reintentar, revisar el diagnóstico o buscar una actualización.',
            { 0: error.message || error },
          ),
          buttons: [
            t('Reintentar'),
            t('Ver diagnóstico'),
            t('Buscar actualizaciones'),
            t('Salir'),
          ],
          cancelId: 3,
          defaultId: 0,
          noLink: true,
        });
        if (response === 0) retry = true;
        else if (response === 1) await showLogs();
        else if (response === 2) await checkUpdates();
        else return false;
      }
    }
  }
}
