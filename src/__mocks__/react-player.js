/**
 * Mock for react-player in Jest (ESM package is not transformed by default).
 * Renders a simple div so VideoEmbed layout and caption are testable.
 */
const React = require('react');

function ReactPlayer({ url, light, playIcon }) {
  return React.createElement(
    'div',
    {
      'data-testid': 'react-player-mock',
      'data-url': url,
      'data-light': !!light
    },
    playIcon
  );
}

module.exports = ReactPlayer;
module.exports.default = ReactPlayer;
