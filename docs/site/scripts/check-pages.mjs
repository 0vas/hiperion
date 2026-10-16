import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../.vitepress/dist',
);
const base = process.env.HYPERION_DOCS_BASE || '/hyperion/';
assert.match(
  base,
  /^\/(?:.*\/)?$/,
  'Pages base must start and end with a slash',
);
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) inspect(path);
    else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      for (const [, resource] of html.matchAll(
        /(?:src|href)="(\/[^"?#]+\.(?:css|js|png|svg|webp))"/g,
      )) {
        assert.ok(
          resource.startsWith(base),
          `${path}: wrong Pages path ${resource}; expected ${base}`,
        );
        assert.ok(
          existsSync(
            join(root, decodeURIComponent(resource.slice(base.length))),
          ),
          `${path}: missing resource ${resource}`,
        );
      }
    }
  }
}
inspect(root);
for (const locale of ['', 'en/']) {
  const html = readFileSync(join(root, locale, 'index.html'), 'utf8');
  assert.ok(
    html.includes('Antigravity'),
    `Missing Antigravity in ${locale || 'ES'} home`,
  );
  assert.ok(html.includes(`${base}assets/`), 'Missing generated assets');
}
console.log(
  `Pages resources verified under ${base} (ES/EN, including Antigravity)`,
);
