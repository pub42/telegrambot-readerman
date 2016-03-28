'use strict';

/**
 * Module dependencies.
 */
const
  toMarkdown = require('to-markdown');


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
  return toMarkdown(html, {
    converters: [{
      filter: 'br',
      replacement: () => '\n'
    },{
      filter: (node) => TELEGRAM_SUPPORED_TAGS.indexOf(node.nodeName.toLowerCase()) === -1,
      replacement: (content) => content
    }]
  });
};