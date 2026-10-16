import { t } from './i18n';
import type { ContinuationState } from '../domain/continuation';
export function continuationLabel(state: ContinuationState) {
  switch (state.status) {
    case 'waiting':
      return t('Pausa guardada');
    case 'queued':
      return t('Reanudación pendiente');
    case 'leased':
      return t('Conector retomando');
    case 'delivered':
      return t('Solicitud entregada al agente');
    case 'failed':
      return t('No se pudo reanudar');
    case 'uncertain':
      return t('Comprobar la reanudación');
    case 'cancelled':
      return t('Reanudación cancelada');
  }
}
