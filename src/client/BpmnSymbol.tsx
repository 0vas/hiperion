/** BPMN geometry is real SVG, independent of zoom, theme and orientation. */
export function BpmnSymbol({
  kind,
}: {
  kind: 'start' | 'end' | 'parallel' | 'exclusive' | 'inclusive';
}) {
  const gateway = !['start', 'end'].includes(kind);
  return (
    <svg
      className="bpmn-symbol"
      data-bpmn={kind}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      {gateway ? (
        <path className="symbol-outline" d="M32 3 61 32 32 61 3 32Z" />
      ) : (
        <circle
          className="symbol-outline"
          cx="32"
          cy="32"
          r="24"
          strokeWidth={kind === 'end' ? 5 : 2}
        />
      )}
      {kind === 'parallel' && <path d="M32 20v24M20 32h24" />}
      {kind === 'exclusive' && <path d="m23 23 18 18m0-18L23 41" />}
      {kind === 'inclusive' && <circle cx="32" cy="32" r="12" />}
    </svg>
  );
}
