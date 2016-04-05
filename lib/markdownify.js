'use strict';

/**
 * Module dependencies.
 */
const
  sanitizeHtml  = require('sanitize-html'),
  toMarkdown    = require('to-markdown');


/**
 * Module specific configurations.
 */
const TELEGRAM_SUPPORED_TAGS = [
  'b', 'strong',
  'i', 'em',
  'a',
  'code',
  'pre'
];

module.exports = exports = (html) => {
  return toMarkdown(sanitizeHtml(html, { allowedTags: TELEGRAM_SUPPORED_TAGS }), {
    converters: [{
      filter: 'br',
      replacement: () => '\n'
    }, {
      filter: (node) => node.nodeName === 'PRE' && (node.innerHTML.toString().toLowerCase().indexOf('<code>') === -1),
      replacement: (content) => '```\n' + content + '\n```'
    }]
  });
};