import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

type Frames = string[][];

/** Sample the actual routed SVG path, so the ribbons also follow elbows. */
function ribbonFrames(path: SVGPathElement): Frames {
  const length = path.getTotalLength();
  if (!Number.isFinite(length) || length < 1) return [];
  const count = Math.min(120, Math.max(24, Math.ceil(length / 4)));
  const amplitude = Math.min(3.5, length / 20);
  const cycles = Math.min(6, Math.max(1, length / 120));
  const points = Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const at = path.getPointAtLength(t * length);
    const before = path.getPointAtLength(Math.max(0, t * length - 1));
    const after = path.getPointAtLength(Math.min(length, t * length + 1));
    const norm = Math.hypot(after.x - before.x, after.y - before.y) || 1;
    return {
      x: at.x,
      y: at.y,
      nx: -(after.y - before.y) / norm,
      ny: (after.x - before.x) / norm,
      t,
    };
  });
  // 32 equally spaced phases match ribbon-wave in process.css.
  // The final keyframe reuses phase zero, keeping the cycle closed.
  return Array.from({ length: 3 }, (_, strand) =>
    Array.from({ length: 32 }, (_, frame) => {
      const sides = [1, -1].map((side) =>
        points.map(({ x, y, nx, ny, t }) => {
          const envelope = Math.sin(Math.PI * t) ** 0.7;
          const phase =
            t * Math.PI * 2 * cycles -
            (frame * Math.PI * 2) / 32 +
            (strand * Math.PI * 2) / 3;
          const wave = Math.sin(phase) * amplitude * envelope;
          const width =
            (0.25 + envelope * (0.8 + 0.12 * Math.cos(phase))) * side;
          return `${(x + nx * (wave + width)).toFixed(2)},${(y + ny * (wave + width)).toFixed(2)}`;
        }),
      );
      return `M${sides[0]!.join(' L')} L${sides[1]!.reverse().join(' L')} Z`;
    }),
  );
}

export function FlowRibbons({
  path,
  flowing,
  color,
  horizontal,
}: {
  path: string;
  flowing: boolean;
  color: string;
  horizontal: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const measure = useRef<SVGPathElement>(null);
  const [frames, setFrames] = useState<Frames>([]);
  useLayoutEffect(() => {
    if (measure.current) setFrames(ribbonFrames(measure.current));
  }, [path]);
  return (
    <g
      className={`flow-ribbons${flowing ? ' is-flowing' : ''}`}
      style={{ color }}
      aria-hidden="true"
    >
      <path
        ref={measure}
        d={path}
        fill="none"
        stroke="none"
        className="ribbon-guide"
      />
      <defs>
        <linearGradient
          id={id}
          x1="0%"
          y1="0%"
          x2={horizontal ? '0%' : '100%'}
          y2={horizontal ? '100%' : '0%'}
        >
          <stop offset="0%" className="ribbon-shade" />
          <stop offset="35%" className="ribbon-light" />
          <stop offset="62%" stopColor="currentColor" />
          <stop offset="100%" className="ribbon-shade" />
        </linearGradient>
      </defs>
      {frames.map((shapes, strand) => (
        <path
          key={strand}
          className={`flow-ribbon strand-${strand}`}
          d={shapes[0]}
          fill={`url(#${id})`}
          style={
            Object.fromEntries(
              shapes.map((shape, i) => [`--ribbon-${i}`, `path("${shape}")`]),
            ) as CSSProperties
          }
        />
      ))}
    </g>
  );
}
