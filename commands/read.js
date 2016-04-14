'use strict';

/**
 * Module dependencies.
 */
const
  Promise     = require('bluebird'),
  debug       = require('debug'),
  _           = require('underscore'),
  mongoose    = require('mongoose'),
  markdownify = require('../lib/markdownify'),
  fetch       = require('../lib/fetch'),
  User        = mongoose.model('User'),
  Feed        = mongoose.model('Feed'),
  Subscribe   = mongoose.model('Subscribe');

const
  log         = debug('telegrambot-reanderman:command:read');

const getUser = (from) => {
  return new Promise((resolve, reject) => {
    User.findOne({
      id: from.id
    }).exec((e, user) => {
      if (e) { return reject(e); }

      if (!user) {
        return reject(new Error(`Can't find user id ${from.id}`));
      }

      resolve(user);
    });
  });
};

const getFeed = (user, urlOrNumber) => {
  return new Promise((resolve, reject) => {
    const query = isNaN(+urlOrNumber) ? {url: urlOrNumber} : {number: +urlOrNumber};

    Feed.findOne(query).exec((e, feed) => {
      if (e) { return reject(e); }

      if (!feed) { return resolve([]); }

      Subscribe.findOne({
        user: user._id,
        feed: feed._id
      }).populate('feed').exec((e, subscribe) => {
        if (e) { return reject(e); }

        if (!subscribe) { return resolve([]); }
        resolve([subscribe.feed]);
      })
    });
  });
};

const getFeeds = (user) => {
  return new Promise((resolve, reject) => {
    Subscribe.find({
      user: user._id
    }).populate('feed').exec((e, subscribes) => {
      if (e) { return reject(e); }

      resolve(_.pluck(subscribes, 'feed'));
    })
  });
};

module.exports = exports = (bot) => {
  bot.onText(/\/read(?: (.+))?/, (message, matches) => {
    getUser(message.from)
    .then((user) => {
      return matches && matches[1] ? getFeed(user, matches[1]) : getFeeds(user);
    }).then((feeds) => {
      if (! feeds.length) {
        bot.sendMessage(message.from.id, '구독 중인 피드가 아니거나, 구독 중인 피드가 없습니다. +0+');
      }
      return Promise.map(feeds, (feed) => fetch(feed.url));
    }).then((feeds) => {
      return Promise.map(feeds, (feed) => {
        const record = feed.records && feed.records[0];

        return bot.sendMessage(message.from.id, record ? [
          `*[${feed.meta.title}]*`,
          ``,
          `[${record.title}](${record.link})`,
          `${record.author || ''}`,
          `[글 바로가기](${record.link})`,
          '',
          `${markdownify(record.summary || record.description).substr(0, 200)}...[더 읽기](${record.link})`
        ].join('\n') : [
          `*[${feed.meta.title}] 등록된 글이 없습니다! T0T *`
        ], {
          parse_mode: 'Markdown'
        });
      })
    }).catch((e) => {
      log(e.stack);
      bot.sendMessage(message.from.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
    });
  });
};