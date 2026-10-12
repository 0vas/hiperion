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
const signed = Boolean(
  process.env.CSC_LINK || process.env.HYPERION_SIGN_IDENTITY,
);
module.exports = {
  ...build,
  mac: {
    ...build.mac,
    // Always seal the bundle. Ad-hoc previews are not Developer ID/notarized builds.
    identity: signed ? process.env.HYPERION_SIGN_IDENTITY : '-',
    hardenedRuntime: signed,
    notarize: signed,
  },
};
