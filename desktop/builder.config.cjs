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
