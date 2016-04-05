'use strict';

/**
 * Module dependencies.
 */

const
  Promise     = require('bluebird'),
  debug       = require('debug'),
  request     = require('request'),
  moment      = require('moment'),
  FeedParser  = require('feedparser'),
  URL         = require('url');


const
  log         = debug('telegrambot-reanderman:fetch');


const fetch = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) { return reject(new Error(`Bad URL (url: ${url}`)); }

    const
      feedparser = new FeedParser(),
      items     = [];

    var stream = request({
      method: 'GET',
      url: url
    }).on('error', (e) => {
      return reject(e);
    }).on('response', (res) => {
      if (res.statusCode != 200) return stream.emit('error', new Error(`Bad status code (status: ${res.statusCode}, url: ${url})`));

      stream.pipe(feedparser);
    });

    feedparser.on('error', (e) => {
      return reject(e);
    }).on('readable', () => {
      // This is where the action is!
      var item;

      while (item = feedparser.read()) {
        items.push(item);
      }
    }).on('end', () => {
      feedparser.meta.lastRecordLink = items.length ? (item[0].link || null) : null;

      resolve({
        meta: feedparser.meta,
        records: items
      });
    })
  });
};

module.exports = exports = fetch;