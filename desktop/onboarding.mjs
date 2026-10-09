const clients = ['codex', 'cursor', 'claude-desktop', 'claude-code'];
export async function connectWithDialog({
  window,
  dialog,
  clipboard,
  setup,
  options,
}) {
  const choice = await dialog.showMessageBox(window, {
    type: 'question',
    title: 'Conectar Hyperion',
    message: '¿Dónde conversarás con tu IA?',
    detail:
      'Elige una aplicación instalada. Hyperion preparará su conexión local. Después podrás crear flujos desde cualquier conversación.',
    buttons: ['Codex', 'Cursor', 'Claude Desktop', 'Claude Code', 'Ahora no'],
    defaultId: 0,
    cancelId: 4,
    noLink: true,
  });
  const client = clients[choice.response];
  if (!client) return false;
  await setup(client, options);
  const result = await dialog.showMessageBox(window, {
    type: 'info',
    title: 'Hyperion listo',
    message: 'Conexión configurada',
    detail:
      'Reinicia tu aplicación de IA y abre una nueva conversación. Escribe «Usa Hyperion para…» y describe lo que quieres conseguir. Si la aplicación solicita habilitar Hyperion, acepta para usar sus herramientas.\n\nPuedes elegir vista dividida o escritorio desde el chat.',
    buttons: ['Copiar petición de prueba', 'Listo'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  if (result.response === 0)
    clipboard.writeText(
      'Usa Hyperion para preparar una guía breve de bienvenida a mi proyecto.',
    );
  return true;
}
