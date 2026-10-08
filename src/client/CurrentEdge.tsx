import {
  BaseEdge,
  Position,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import type { FlowState } from './flow-visuals';

type Current = Edge<{ state: FlowState; current: boolean }, 'current'>;

/** A continuous channel with a moving SVG highlight in source → target order. */
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
        <path
          d={path}
          pathLength={100}
          className={`liquid-stream${props.data?.current ? ' is-flowing' : ''}`}
          style={{ stroke: props.style?.stroke }}
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        labelX={labelX}
        labelY={labelY}
        markerEnd={props.markerEnd}
        markerStart={props.markerStart}
        style={props.style}
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
