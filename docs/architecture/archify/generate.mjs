import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const packagePath = process.argv[2];
if (!packagePath)
  throw new Error(
    'Pass the path to the pinned Archify archify/ directory. See README.md.',
  );
const archify = resolve(packagePath);
const pinned = '58ab0b98d2d0def8e49dced705c7b566936723ec';
const revision = execFileSync('git', ['-C', archify, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
if (revision !== pinned)
  throw new Error(`Expected Archify revision ${pinned}, got ${revision}`);
const proof = mkdtempSync(resolve(tmpdir(), 'hyperion-archify-proof-'));
for (const view of ['hyperion', 'process', 'continuation']) {
  for (const locale of ['es', 'en']) {
    const output = `docs/site/public/architecture/${view}-${locale}.html`;
    const result = execFileSync(
      process.execPath,
      [
        resolve(archify, 'bin/archify.mjs'),
        'finalize',
        'architecture',
        `docs/architecture/archify/${view}.${locale}.json`,
        output,
        '--repo-root',
        root,
        '--quality',
        'showcase',
        '--out-dir',
        resolve(proof, `${view}-${locale}`),
        '--json',
      ],
      { cwd: root, encoding: 'utf8' },
    );
    const receipt = JSON.parse(result);
    if (!receipt.ok) throw new Error(result);
    // Archify writes this extra local receipt beside the HTML even with --out-dir.
    rmSync(resolve(root, output.replace('.html', '.delivery.json')), {
      force: true,
    });
    console.log(
      `${view}/${locale}: ${receipt.status}; browser ${receipt.gates['browser-check']}; evidence ${proof}`,
    );
  }
}
