import { checkForUpdate, downloadUpdate } from './updates.mjs';
import { join } from 'node:path';
export function createUpdateController({
  app,
  dialog,
  shell,
  getWindow,
  check = checkForUpdate,
  download = downloadUpdate,
}) {
  let busy = false,
    controller;
  return {
    cancel() {
      controller?.abort();
    },
    async check(manual = true) {
      if (busy) return;
      busy = true;
      const window = getWindow();
      try {
        const update = await check(
          app.getVersion(),
          process.platform,
          process.arch,
        );
        if (!update) {
          if (manual)
            await dialog.showMessageBox(window, {
              type: 'info',
              message: 'No hay una versión más reciente compatible',
              detail: `Versión instalada: ${app.getVersion()}`,
              buttons: ['Listo'],
            });
          return;
        }
        const answer = await dialog.showMessageBox(window, {
          type: 'info',
          message: `Hyperion ${update.version} está disponible`,
          detail: `Tienes ${app.getVersion()}. Se descargará el instalador desde GitHub y se verificará su integridad. La instalación se realiza después, con las comprobaciones de tu sistema.`,
          buttons: ['Descargar actualización', 'Ahora no'],
          cancelId: 1,
        });
        if (answer.response !== 0) return;
        const choice = await dialog.showSaveDialog(window, {
          title: 'Guardar actualización de Hyperion',
          defaultPath: join(app.getPath('downloads'), update.asset.name),
        });
        if (choice.canceled || !choice.filePath) return;
        controller = new AbortController();
        await download(update, choice.filePath, {
          signal: controller.signal,
          onProgress: (p) => {
            if (window && !window.isDestroyed()) window.setProgressBar(p);
          },
        });
        const done = await dialog.showMessageBox(window, {
          type: 'info',
          message: 'Actualización descargada y verificada',
          detail:
            'Abre el instalador para actualizar Hyperion. Tus flujos se conservan en su almacenamiento local.',
          buttons: ['Mostrar instalador', 'Listo'],
          cancelId: 1,
        });
        if (done.response === 0) shell.showItemInFolder(choice.filePath);
      } catch (error) {
        if (!controller?.signal.aborted && (manual || controller))
          await dialog.showMessageBox(window, {
            type: 'error',
            message: 'No se pudo completar la actualización',
            detail: String(error.message || error),
            buttons: ['Listo'],
          });
      } finally {
        if (window && !window.isDestroyed()) window.setProgressBar(-1);
        controller = undefined;
        busy = false;
      }
    },
  };
}
