/** Keep recovery actions available when the local service cannot start. */
export async function recoverStartup({
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
          title: 'Hyperion no pudo iniciar',
          message: 'No se pudo abrir el servicio local',
          detail: `${error.message || error}\n\nTus flujos no se han borrado. Puedes reintentar, revisar el diagnóstico o buscar una actualización.`,
          buttons: [
            'Reintentar',
            'Ver diagnóstico',
            'Buscar actualizaciones',
            'Salir',
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
