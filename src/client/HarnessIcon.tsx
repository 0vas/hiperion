import codex from './brands/codex.svg?raw';
import claude from './brands/claude.svg?raw';
import cursor from './brands/cursor.svg?raw';
const brands: Record<string, { label: string; svg: string }> = {
  codex: { label: 'Codex', svg: codex },
  claude: { label: 'Claude', svg: claude },
  cursor: { label: 'Cursor', svg: cursor },
};
export function HarnessIcon({ name }: { name: string }) {
  const brand = brands[name.toLowerCase()];
  return (
    <span
      className="harness-icon"
      role="img"
      aria-label={brand?.label || name}
      title={brand?.label || name}
    >
      {brand ? (
        <span
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: brand.svg }}
        />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <rect x="4" y="7" width="16" height="13" rx="4" />
          <path d="M12 3v4M8 12v3m8-3v3M9 18h6" />
        </svg>
      )}
    </span>
  );
}
