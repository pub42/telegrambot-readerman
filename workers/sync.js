'use strict';

/**
 * Module dependencies.
 */
const
  Promise     = require('bluebird'),
  debug       = require('debug'),
  _           = require('underscore'),
  mongoose    = require('mongoose'),
  fetch       = require('../lib/fetch'),
  markdownify = require('../lib/markdownify'),
  Feed        = mongoose.model('Feed'),
  Subscribe   = mongoose.model('Subscribe');


const
  log         = debug('telegrambot-reanderman:sync');


const getFeeds = () => {
  return new Promise((resolve ,reject) => {
    Subscribe.aggregate()
    .group({
      _id: '$feed',
      count: {
        $sum: 1
      }
    }).exec((e, feeds) => {
      if (e) { return reject(e); }

      Feed.find({
        _id: {
          $in: feeds.map((feed) => feed._id)
        }
      }).exec((e, feeds) => {
        if (e) { return reject(e); }

        resolve(feeds);
      });
    });
  });
};

const updateFeed = (feed, fetched) => {
  return new Promise((resolve, reject) => {
    let _lastRecordLink = feed.lastRecordLink;

    feed.lastRecordLink = fetched.meta.lastRecordLink;

    feed.save((e) => {
      if (e) { return reject(e); }

      resolve({
        feed: feed,
        fetched: fetched,
        lastRecordLink: _lastRecordLink
      });
    });
  });
};

const silentSendMessage = (bot, id, message, options) => {
  return new Promise((resolve, reject) => {
    bot.sendMessage(id, message ,options)
    .then((res) => {
      resolve(res);
    }).catch(() => {
      resolve(false);
    });
  });
};

const publishFeed = (bot, feed, fetched, lastRecordLink) => {
  return new Promise((resolve, reject) => {
    Subscribe.find({
      feed: feed._id
    }).populate('user')
    .exec((e, subscribes) => {
      if (e) { return reject(e); }

      const
        index = _.findIndex(fetched.records, (record) => record.link === lastRecordLink),
        delta = index === -1 ? fetched.records : fetched.records.slice(0, index);

      Promise.map(subscribes.map((subscribe) => subscribe.user), (user) => {
        return Promise.map(delta, (record) => {
          return silentSendMessage(bot, user.id, record ? [
            `*[${fetched.meta.title}]*`,
            ``,
            `[${record.title}](${record.link})`,
            `${record.author || ''}`,
            '',
            `${markdownify(record.summary || record.description).substr(0, 200)}...[read more](${record.link})`
          ].join('\n') : [
            `*[${fetched.meta.title}] Not present *`
          ], {
            parse_mode: 'Markdown'
          });
        }, {concurrency: 1});
      }, {concurrency: 2})
      .then((results) => {
        resolve(results.length);
      }).catch((e) => {
        reject(e);
      });
    });
  });
};



module.exports = exports = (bot) => {
  getFeeds()
  .then((feeds) => {
    log('Got %d feed targets, fetching feeds...', feeds.length);
    let
      current = 0,
      total = feeds.length;

    return Promise.map(feeds, (feed, index) => {
      log('fetching feed index %d: %s', index, feed.url);
      let timeout = setTimeout(() => {
        log('fetch not responding! index: %s, url: %s', index, feed.url);
      }, 1000 * 30);

      return fetch(feed.url)
      .then((fetched) => {
        log('fetched index %d (%d of %d)', index, ++current, total);
        clearTimeout(timeout);
        return Promise.resolve({
          updated: (fetched.meta.lastRecordLink !== feed.lastRecordLink),
          feed: feed,
          fetched: fetched
        });
      }).catch((e) => {
        clearTimeout(timeout);
        log('fetched index %d (%d of %d)', index, ++current, total);
        log('ERR: feed %s got an error!', feed.url);
        log(e.stack);
        return Promise.resolve({
          updated: false,
          feed: feed
        });
      });
    }, {concurrency: 2});
  }).then((feeds) => {
    const updatedFeeds = feeds.filter((feed) => feed && feed.updated);
    log('Fetched %d feeds, there are %d updated feeds.', feeds.length, updatedFeeds.length);

    return Promise.map(updatedFeeds, (feed) => updateFeed(feed.feed, feed.fetched), {concurrency: 2});
  }).then((feeds) => {
    log('Updated feed metadata into database. publishing feeds to subscribers...');
    return Promise.map(feeds, (feed) => publishFeed(bot, feed.feed, feed.fetched, feed.lastRecordLink), {concurrency: 1});
  }).then((results) => {
    log('sent %d messages of %d feeds', results.reduce((memo, x) => memo + x, 0), results.length);
    process.exit(0);
  }).catch((e) => {
    log(e.stack);
    process.exit(1);
  });
};
