// GitHub exposes unset secrets as empty strings; electron-builder treats CSC_LINK='' as a file path.
for (const key of [
  'CSC_LINK',
  'CSC_KEY_PASSWORD',
  'APPLE_ID',
  'APPLE_APP_SPECIFIC_PASSWORD',
  'APPLE_TEAM_ID',
]) {
  if (process.env[key] === '') delete process.env[key];
}
const { build } = require('../package.json');
const release = require('../src/release.json');
const { releaseVersions } = require('./release-version.cjs');
const versions = releaseVersions(release);
const signed = Boolean(
  process.env.CSC_LINK || process.env.HYPERION_SIGN_IDENTITY,
);
if (
  process.env.HYPERION_REQUIRE_NOTARIZATION === '1' &&
  (!signed ||
    !process.env.APPLE_ID ||
    !process.env.APPLE_APP_SPECIFIC_PASSWORD ||
    !process.env.APPLE_TEAM_ID)
)
  throw new Error(
    'Public macOS distribution requires Developer ID and Apple notarization credentials.',
  );
module.exports = {
  ...build,
  buildVersion: versions.buildVersion,
  artifactName: `Hyperion-${release.version}-${'${os}'}-${'${arch}'}.${'${ext}'}`,
  mac: {
    ...build.mac,
    extendInfo: { CFBundleShortVersionString: versions.shortVersion },
    // Always seal the bundle. Ad-hoc previews are not Developer ID/notarized builds.
    identity: signed ? process.env.HYPERION_SIGN_IDENTITY : '-',
    hardenedRuntime: signed,
    notarize: signed,
  },
};
