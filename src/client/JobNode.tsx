import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { ChevronDown, Layers3 } from 'lucide-react';
import type { FlowState } from './flow-visuals';
import type { StepStatus } from '../domain/workflow';
export type JobNodeData = {
  title: string;
  horizontal: boolean;
  completed: number;
  total: number;
  skipped: number;
  status: StepStatus;
  flowState: FlowState;
  statusLabel: string;
  onExpand: () => void;
};
export function JobNode({ data }: NodeProps<Node<JobNodeData>>) {
  return (
    <>
      <Handle
        type="target"
        position={data.horizontal ? Position.Left : Position.Top}
      />
      <div
        className={`job-node step-node flow-node ${data.status}`}
        data-flow-state={data.flowState}
      >
        <button
          className="node-main"
          aria-label={`Ver pasos: ${data.title}`}
          onClick={data.onExpand}
        >
          <div className="node-top">
            <span className="node-phase">
              <Layers3 size={14} /> TRABAJO
            </span>
            <span className={`status-tag ${data.status}`}>
              {data.statusLabel}
            </span>
          </div>
          <strong>{data.title}</strong>
          <progress
            aria-label={`Progreso: ${data.title}`}
            max={data.total}
            value={data.completed + data.skipped}
          />
          <span className="job-progress">
            {data.completed} de {data.total} pasos completados
            {data.skipped > 0 ? ` · ${data.skipped} omitidos` : ''}
          </span>
          <span className="node-action">
            Ver {data.total} {data.total === 1 ? 'paso' : 'pasos'}{' '}
            <ChevronDown size={14} />
          </span>
        </button>
      </div>
      <Handle
        type="source"
        position={data.horizontal ? Position.Right : Position.Bottom}
      />
    </>
  );
}
