'use strict';

/**
 * Module dependencies.
 */

const
  Promise     = require('bluebird'),
  request     = require('request'),
  moment      = require('moment'),
  FeedParser  = require('feedparser'),
  URL         = require('url');


const fetch = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) { return reject(new Error('Bad URL')); }

    const
      feedparser = new FeedParser(),
      items     = [];

    var stream = request({
      method: 'GET',
      url: url
    }).on('error', (e) => {
      return reject(e);
    }).on('response', (res) => {
      if (res.statusCode != 200) return stream.emit('error', new Error('Bad status code'));

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
      feedparser.meta.updatedAt = feedparser.meta.date || feedparser.meta.pubdate || feedparser.meta.pubDate;

      if (isNaN(feedparser.meta.updatedAt.getTime())) {
        console.error('warning: %s seems not standard pubDate. trying to parse using moment...', url);

        // cannot parse pubDate?
        // try to parse pubDate using moment.
        let _pubDate = feedparser.meta['rss:date'] || feedparser.meta['rss:pubdate'] || feedparser.meta['rss:pubDate'];
        let pubDate = moment((_pubDate && _pubDate['#']), [
          'll dddd a h:m:s'
        ], 'ko');
        if (pubDate.isValid()) {
          console.error('woo, moment parsed date! (original: %s, parsed: %s)', _pubDate['#'], pubDate.format('YYYY-MM-DD HH:mm:ss'))
          feedparser.meta.updatedAt = pubDate.toDate();
        }
      }

      if (isNaN(feedparser.meta.updatedAt.getTime())) {
        console.error('warning: %s seems not standard pubDate. trying to use record pubDate...', url);
        // cannot parse pubDate using moment?
        // try to using pubdate of first record.
        let record = items[0] || {};
        let pubDate = record.pubDate || record.pubdate || record.date;
        if (pubDate && !isNaN(pubDate.getTime())) {
          console.error('woo, got pubDate from first record! (%s)', pubDate);
          feedparser.meta.updatedAt = pubDate
        }
      }

      if (isNaN(feedparser.meta.updatedAt.getTime())) {
        // We can't handle pubDate!
        console.error('error: %s seems not standard pubDate. failed to reading pubDate!', url);
        feedparser.meta.updatedAt = new Date(0);
      }

      resolve({
        meta: feedparser.meta,
        records: items
      });
    })
  });
};

module.exports = exports = fetch;