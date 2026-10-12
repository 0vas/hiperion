import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { releaseVersions } from '../desktop/release-version.cjs';
const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const { packageVersion } = releaseVersions(read('src/release.json'));
for (const path of ['package.json', 'package-lock.json']) {
  const value = read(path);
  value.version = packageVersion;
  if (value.packages?.['']) value.packages[''].version = packageVersion;
  writeFileSync(
    fileURLToPath(new URL(path, root)),
    JSON.stringify(value, null, 2) + '\n',
  );
}
console.log(
  `Package compatibility version: ${packageVersion}. Public version is in src/release.json.`,
);
