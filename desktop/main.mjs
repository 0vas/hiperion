import { app, BrowserWindow, dialog, session, Menu } from 'electron';
import { fileURLToPath } from 'node:url';
import { installSkill } from '../dist/adapters/install.js';
import { ensureServer } from '../dist/adapters/bootstrap.js';
import {
  desktopTarget,
  rememberDesktop,
  rememberWorkspace,
} from '../dist/adapters/desktop.js';
let window;
let target;
const pending = [];
const isLocal = (url) => {
  try {
    return new URL(url).origin === target.service;
  } catch {
    return false;
  }
};
async function openRun(args) {
  const next = desktopTarget(args);
  if (
    target &&
    (target.service !== next.service || target.directory !== next.directory)
  )
    throw new Error(
      'Cierra Hyperion Desktop antes de conectar otra instancia local. Tu flujo actual está protegido.',
    );
  await ensureServer({ directory: next.directory, url: next.service });
  target = next;
  rememberWorkspace(next);
  if (!window || window.isDestroyed()) {
    window = new BrowserWindow({
      title: 'Hyperion',
      width: 1200,
      height: 820,
      minWidth: 390,
      minHeight: 480,
      backgroundColor: '#171e23',
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    window.webContents.on('will-navigate', (event, url) => {
      if (!isLocal(url)) event.preventDefault();
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (isLocal(url)) void window.loadURL(url);
      return { action: 'deny' };
    });
    window.once('ready-to-show', () => window.show());
  }
  await window.loadURL(next.url);
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}
function report(error) {
  dialog.showErrorBox(
    'Hyperion',
    error instanceof Error ? error.message : String(error),
  );
}
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (!app.isReady()) pending.push(argv);
    else void openRun(argv).catch(report);
  });
  app
    .whenReady()
    .then(async () => {
      session.defaultSession.setPermissionRequestHandler(
        (contents, permission, callback) =>
          callback(
            isLocal(contents.getURL()) &&
              permission === 'clipboard-sanitized-write',
          ),
      );
      session.defaultSession.setPermissionCheckHandler((contents, permission) =>
        Boolean(
          contents &&
          isLocal(contents.getURL()) &&
          permission === 'clipboard-sanitized-write',
        ),
      );
      await openRun(process.argv);
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([
          {
            label: 'Hyperion',
            submenu: [
              {
                label: 'Conectar con mi IA',
                click: () => {
                  try {
                    installSkill({ directory: target.directory });
                    void dialog.showMessageBox({
                      type: 'info',
                      message: 'Conexión preparada',
                      detail:
                        'Abre una nueva conversación en una herramienta compatible con skills y pide: Usa Hyperion en escritorio para…',
                    });
                  } catch (error) {
                    report(error);
                  }
                },
              },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
          { role: 'editMenu' },
          { role: 'viewMenu' },
          { role: 'windowMenu' },
        ]),
      );

      rememberDesktop({
        executable: process.execPath,
        args: app.isPackaged ? [] : [fileURLToPath(import.meta.url)],
      });
      for (const args of pending) await openRun(args);
    })
    .catch((error) => {
      report(error);
      app.quit();
    });
  app.on('activate', () => {
    if (!window || window.isDestroyed())
      void openRun(process.argv).catch(report);
  });
  app.on('window-all-closed', () => app.quit());
}
