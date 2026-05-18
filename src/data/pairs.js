// Single source of truth lives in shared/pairs.js at the workspace root.
// Metro is configured in metro.config.js to watch the workspace root,
// which allows this cross-project import to resolve correctly.
//
// To add or edit pairs: edit shared/pairs.js only — never edit this file.

module.exports = require('../../../shared/pairs');
