const clients = [
  'codex',
  'cursor',
  'claude-desktop',
  'claude-code',
  'antigravity',
];
export async function connectWithDialog({
  t = (message, values = {}) =>
    message.replace(/\{(\d+)\}/g, (match, key) =>
      values[key] === undefined ? match : String(values[key]),
    ),
  window,
  dialog,
  clipboard,
  setup,
  options,
}) {
  const choice = await dialog.showMessageBox(window, {
    type: 'question',
    title: t('Conectar Hyperion'),
    message: t('¿Dónde conversarás con tu IA?'),
    detail: t(
      'Elige una aplicación instalada. Hyperion preparará su conexión local. Después podrás crear flujos desde cualquier conversación.',
    ),
    buttons: [
      'Codex',
      'Cursor',
      'Claude Desktop',
      'Claude Code',
      'Antigravity',
      t('Ahora no'),
    ],
    defaultId: 0,
    cancelId: clients.length,
    noLink: true,
  });
  const client = clients[choice.response];
  if (!client) return false;
  await setup(client, options);
  const result = await dialog.showMessageBox(window, {
    type: 'info',
    title: t('Hyperion listo'),
    message: t('Conexión configurada'),
    detail: t(
      'Reinicia tu aplicación de IA y abre una nueva conversación. Escribe «Usa Hyperion para…» y describe lo que quieres conseguir. Si la aplicación solicita habilitar Hyperion, acepta para usar sus herramientas.\n\nPuedes elegir vista dividida o escritorio desde el chat.',
    ),
    buttons: [t('Copiar petición de prueba'), t('Listo')],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  if (result.response === 0)
    clipboard.writeText(
      t(
        'Usa Hyperion para preparar una guía breve de bienvenida a mi proyecto.',
      ),
    );
  return true;
}
