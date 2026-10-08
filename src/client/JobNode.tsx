import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { ChevronDown, Layers3 } from 'lucide-react';
import type { StepStatus } from '../domain/workflow';
export type JobNodeData = {
  title: string;
  completed: number;
  total: number;
  skipped: number;
  status: StepStatus;
  statusLabel: string;
  onExpand: () => void;
};
export function JobNode({ data }: NodeProps<Node<JobNodeData>>) {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className={`job-node step-node ${data.status}`}>
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
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
