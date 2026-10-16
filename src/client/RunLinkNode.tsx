import { NodeDragHandle } from './NodeDragHandle';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { ArrowUpRight, CircleCheck, Plus, GitBranch } from 'lucide-react';
import { t, useLocale } from './i18n';
export type RunLinkData = {
  title: string;
  direction: 'previous' | 'next' | 'new';
  horizontal: boolean;
  onOpen: () => void;
};
export function RunLinkNode({ data }: NodeProps<Node<RunLinkData>>) {
  useLocale();
  return (
    <div className="run-link-node">
      <NodeDragHandle />
      <Handle
        type="target"
        position={data.horizontal ? Position.Left : Position.Top}
      />
      <button
        onClick={data.onOpen}
        aria-label={
          data.direction === 'new'
            ? t('Continuar desde aquí')
            : t('Abrir recorrido: {0}', { 0: data.title })
        }
      >
        <span className="eyebrow">
          {data.direction === 'previous' ? (
            <CircleCheck size={17} />
          ) : data.direction === 'new' ? (
            <Plus size={17} />
          ) : (
            <GitBranch size={17} />
          )}
          {data.direction === 'previous'
            ? t('Fin anterior')
            : data.direction === 'new'
              ? t('¿Qué sigue?')
              : t('Nuevo inicio')}
        </span>
        <strong>{data.title}</strong>
        <ArrowUpRight size={16} />
      </button>
      <Handle
        type="source"
        position={data.horizontal ? Position.Right : Position.Bottom}
      />
    </div>
  );
}
