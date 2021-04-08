
const epsagon = require('epsagon');
const epsagonHandler = require('../services/user.js');



  if (!process.env.EPSAGON_IGNORED_KEYS) {
    process.env.EPSAGON_IGNORED_KEYS = "";
  }

  if (!process.env.EPSAGON_URLS_TO_IGNORE) {
    process.env.EPSAGON_URLS_TO_IGNORE = "";
  }

epsagon.init({
    token: 'ecaf8eeb-6e6b-4114-80b3-0d9014bbc0f7',
    appName: 'chikachika-dev',
    traceCollectorURL: undefined,
    metadataOnly: Boolean(0),
    labels: [],
});

exports.getUserProfile = epsagon.lambdaWrapper(epsagonHandler.getUserProfile);
