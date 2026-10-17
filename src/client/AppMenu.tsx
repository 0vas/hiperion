import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { t, useLocale } from './i18n';
import { RELEASE_CHANNEL, VERSION } from '../version';
import type { ConnectionInventory } from './Connections';

export type AppMenuAction =
  | 'connections'
  | 'settings'
  | 'guide'
  | 'help'
  | 'legend'
  | 'window'
  | 'updates'
  | 'about';

function calVerLabel(inventory: ConnectionInventory | null) {
  const version = inventory?.version || VERSION;
  const channel = inventory?.channel || RELEASE_CHANNEL || 'preview';
  return t('Hyperion {0} UTC · {1}', { 0: version, 1: channel });
}

function shouldAnimateMenu(reduceMotion: boolean) {
  if (reduceMotion) return false;
  if (typeof matchMedia !== 'function') return true;
  return !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AppMenu({
  open,
  onOpenChange,
  inventory,
  reduceMotion,
  isElectron,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: ConnectionInventory | null;
  reduceMotion: boolean;
  isElectron: boolean;
  onAction: (action: AppMenuAction) => void;
}) {
  useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const version = calVerLabel(inventory);
  const animate = shouldAnimateMenu(reduceMotion);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const runAction = (action: AppMenuAction) => {
    onOpenChange(false);
    // Replace layer: close menu before opening any panel.
    window.setTimeout(() => onAction(action), 0);
  };

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled])',
      ),
    ];
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="app-menu">
      <button
        ref={triggerRef}
        type="button"
        className="app-menu-trigger"
        aria-label={open ? t('Cerrar menú') : t('Abrir menú')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => onOpenChange(!open)}
      >
        <span>{t('Menú')}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={menuId}
          className={`app-menu-panel${animate ? ' is-animated' : ' is-instant'}`}
          role="menu"
          aria-label={t('Menú')}
          onKeyDown={onPanelKeyDown}
        >
          <div className="app-menu-version" title={t('Versión de Hyperion')}>
            <span className="form-sr-only">{t('Versión de Hyperion')}: </span>
            {version}
          </div>
          <div className="app-menu-sep" role="separator" />
          <MenuRow onSelect={() => runAction('connections')}>
            {t('Conexiones')}
          </MenuRow>
          <MenuRow onSelect={() => runAction('settings')}>
            {t('Ajustes')}
          </MenuRow>
          <MenuRow onSelect={() => runAction('guide')}>
            {t('Guía de uso')}
          </MenuRow>
          <MenuRow onSelect={() => runAction('help')}>
            {t('Ayuda de conexión')}
          </MenuRow>
          <div className="app-menu-sep" role="separator" />
          <MenuRow onSelect={() => runAction('legend')}>
            {t('Colores del flujo')}
          </MenuRow>
          {!isElectron && (
            <MenuRow onSelect={() => runAction('window')}>
              {t('Abrir en ventana')}
            </MenuRow>
          )}
          {isElectron && (
            <MenuRow onSelect={() => runAction('updates')}>
              {t('Buscar actualizaciones…')}
            </MenuRow>
          )}
          <div className="app-menu-sep" role="separator" />
          <MenuRow onSelect={() => runAction('about')}>
            {t('Acerca de Hyperion')}
          </MenuRow>
        </div>
      )}
    </div>
  );
}

function MenuRow({
  children,
  onSelect,
}: {
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="app-menu-row"
      onClick={onSelect}
    >
      {children}
    </button>
  );
}
