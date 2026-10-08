import {
  BaseEdge,
  Position,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import { FlowRibbons } from './FlowRibbons';
import type { FlowState } from './flow-visuals';

type Current = Edge<{ state: FlowState; current: boolean }, 'current'>;

/** Reached routes carry the wave; unreached routes keep their direction marker. */
export function CurrentEdge(props: EdgeProps<Current>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    ...props,
    borderRadius: 20,
    offset: Math.min(
      20,
      Math.max(
        2,
        Math.abs(
          props.sourcePosition === Position.Bottom ||
            props.sourcePosition === Position.Top
            ? props.targetY - props.sourceY
            : props.targetX - props.sourceX,
        ) / 2,
      ),
    ),
  });
  const reached =
    props.data &&
    ['completed', 'ready', 'active', 'attention', 'paused'].includes(
      props.data.state,
    );
  return (
    <>
      {reached && (
        <path
          d={path}
          className="liquid-channel"
          style={{ stroke: props.style?.stroke }}
        />
      )}
      {reached && (
        <FlowRibbons
          path={path}
          flowing={props.data?.current === true}
          color={String(props.style?.stroke || 'currentColor')}
          horizontal={
            props.sourcePosition === Position.Right ||
            props.sourcePosition === Position.Left
          }
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        labelX={labelX}
        labelY={labelY}
        markerEnd={reached ? undefined : props.markerEnd}
        markerStart={props.markerStart}
        style={reached ? { ...props.style, strokeWidth: 1.4 } : props.style}
        label={props.label}
        labelStyle={props.labelStyle}
        labelShowBg={props.labelShowBg}
        labelBgStyle={props.labelBgStyle}
        labelBgPadding={props.labelBgPadding}
        labelBgBorderRadius={props.labelBgBorderRadius}
        interactionWidth={props.interactionWidth}
      />
    </>
  );
}
