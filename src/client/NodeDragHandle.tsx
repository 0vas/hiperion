import { GripHorizontal } from 'lucide-react';
import { t, useLocale } from './i18n';
export function NodeDragHandle() {
  useLocale();
  return (
    <div
      className="node-drag-handle"
      title={t('Arrastra para mover · Usa las flechas al enfocar el nodo')}
    >
      <GripHorizontal size={18} aria-hidden="true" />
    </div>
  );
}
