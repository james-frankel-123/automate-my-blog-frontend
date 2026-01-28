// @ts-check
const base = require('./playwright.config.js');

/**
 * Playwright config for recording e2e video (full-workflow test).
 * Extends base config with video: 'on' so videos are always retained.
 */
module.exports = {
  ...base,
  use: {
    ...base.use,
    video: 'on',
  },
};
