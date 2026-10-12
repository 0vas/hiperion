import { checkForUpdate, downloadUpdate } from './updates.mjs';
import { join } from 'node:path';
export function createUpdateController({
  t = (message, values = {}) =>
    message.replace(/\{(\d+)\}/g, (match, key) =>
      values[key] === undefined ? match : String(values[key]),
    ),
  app,
  dialog,
  shell,
  getWindow,
  currentVersion = app.getVersion(),
  channel,
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
          currentVersion,
          process.platform,
          process.arch,
          undefined,
          channel,
        );
        if (!update) {
          if (manual)
            await dialog.showMessageBox(window, {
              type: 'info',
              message: t('No hay una versión más reciente compatible'),
              detail: t('Versión instalada: {0}', { 0: currentVersion }),
              buttons: [t('Listo')],
            });
          return;
        }
        const answer = await dialog.showMessageBox(window, {
          type: 'info',
          message: t('Hyperion {0} está disponible', { 0: update.version }),
          detail: t(
            'Tienes {0}. Se descargará el instalador desde GitHub y se verificará su integridad. La instalación se realiza después, con las comprobaciones de tu sistema.',
            { 0: currentVersion },
          ),
          buttons: [t('Descargar actualización'), t('Ahora no')],
          cancelId: 1,
        });
        if (answer.response !== 0) return;
        const choice = await dialog.showSaveDialog(window, {
          title: t('Guardar actualización de Hyperion'),
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
          message: t('Actualización descargada y verificada'),
          detail: t(
            'Abre el instalador para actualizar Hyperion. Tus flujos se conservan en su almacenamiento local.',
          ),
          buttons: [t('Mostrar instalador'), t('Listo')],
          cancelId: 1,
        });
        if (done.response === 0) shell.showItemInFolder(choice.filePath);
      } catch (error) {
        if (!controller?.signal.aborted && (manual || controller))
          await dialog.showMessageBox(window, {
            type: 'error',
            message: t('No se pudo completar la actualización'),
            detail: String(error.message || error),
            buttons: [t('Listo')],
          });
      } finally {
        if (window && !window.isDestroyed()) window.setProgressBar(-1);
        controller = undefined;
        busy = false;
      }
    },
  };
}
