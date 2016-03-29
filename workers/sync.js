'use strict';

/**
 * Module dependencies.
 */
const
  Promise     = require('bluebird'),
  _           = require('underscore'),
  mongoose    = require('mongoose'),
  fetch       = require('../lib/fetch'),
  markdownify = require('../lib/markdownify'),
  Feed        = mongoose.model('Feed'),
  Subscribe   = mongoose.model('Subscribe');


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

    feed.lastModified = fetched.meta.updatedAt;
    feed.lastRecordLink = fetched.records[0].link;

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
          return bot.sendMessage(user.id, record ? [
            `*[${fetched.meta.title}]*`,
            `*${record.title}*`,
            `${record.author || ''}`,
            `[글 바로가기](${record.link})`,
            '',
            `${markdownify(record.summary || record.description).substr(0, 200)}...[더 읽기](${record.link})`
          ].join('\n') : [
            `*[${fetched.meta.title}] 등록된 글이 없습니다! T0T *`
          ], {
            parse_mode: 'Markdown'
          }).then((result) => Promise.resolve(true))
            .catch(() => Promise.resolve(false));
        }, {concurrency: 1});
      }, {concurrency: 4});
    }).then((results) => {
      resolve(results.length);
    }).catch((e) => {
      reject(e);
    })
  });
};


module.exports = exports = (bot) => {
  getFeeds()
  .then((feeds) => {
    return Promise.map(feeds, (feed) => {
      return fetch(feed.url)
      .then((fetched) => {
        return Promise.resolve({
          updated: (fetched.records[0].link !== feed.lastRecordLink),
          feed: feed,
          fetched: fetched
        });
      }).catch((e) => {
        console.error(e.stack);
        return Promise.resolve({
          updated: false,
          feed: feed
        });
      });
    }, {concurrency: 4});
  }).then((feeds) => {
    const updatedFeeds = feeds.filter((feed) => feed && feed.updated);

    return Promise.map(updatedFeeds, (feed) => updateFeed(feed.feed, feed.fetched), {concurrency: 4});
  }).then((feeds) => {
    return Promise.map(feeds, (feed) => publishFeed(bot, feed.feed, feed.fetched, feed.lastRecordLink), {concurrency: 1});
  }).then((results) => {
    console.log('sent %d messages of %d feeds', _.flatten(results).length, results.length);
  }).catch((e) => {
    console.error(e.stack);
  });
};