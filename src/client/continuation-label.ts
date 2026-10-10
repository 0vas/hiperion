import type { ContinuationState } from '../domain/continuation';
export function continuationLabel(state: ContinuationState) {
  switch (state.status) {
    case 'waiting':
      return 'Pausa guardada';
    case 'queued':
      return 'Reanudación pendiente';
    case 'leased':
      return 'Conector retomando';
    case 'delivered':
      return 'Solicitud entregada al agente';
    case 'failed':
      return 'No se pudo reanudar';
    case 'uncertain':
      return 'Comprobar la reanudación';
    case 'cancelled':
      return 'Reanudación cancelada';
  }
}
