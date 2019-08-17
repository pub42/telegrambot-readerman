'use strict';

/**
 * Module dependencies.
 */

const
  Promise   = require('bluebird'),
  debug     = require('debug'),
  mongoose  = require('mongoose'),
  User      = mongoose.model('User'),
  Feed      = mongoose.model('Feed'),
  Subscribe = mongoose.model('Subscribe');

const
  log             = debug('telegrambot-reanderman:command:subscribe');

const unsubscribe = (from, numberOrUrl) => {
  return new Promise((resolve, reject) => {
    User.findOne({
      id: from.id
    }).exec((e, user) => {
      if (e) { return reject(e); }

      if (!user) { return reject(new Error(`Can't find user id ${from.id}`)); }

      const query = isNaN(+numberOrUrl) ? {url: numberOrUrl} : {number: +numberOrUrl};

      Feed.findOne(query).exec((e, feed) => {
        if (e) { return reject(e); }

        if (!feed) {
          return resolve({
            removed: false,
            message: '등록된 피드가 없습니다! 0_0'
          });
        }

        Subscribe.find({
          user: user._id,
          feed: feed._id
        }).remove((e, data) => {
          if (e) { return reject(e); }

          if(data.result.n === 0) {
            return resolve({
              removed: false,
              message: 'There are no subscriptions for the feed you entered! 0_0'
            });
          }

          resolve({
            removed: true,
            feed: feed
          });
        });
      });
    })
  });
};

module.exports = exports = (bot) => {
  bot.onText(/\/unsubscribe(?: (.+))?/, (msg, match) => {
    if (!(match && match[1])) {
      return bot.sendMessage(msg.from.id, 'Please enter a feed number or URL. The feed number can be found with the /list command.');
    }

    unsubscribe(msg.from, match[1])
    .then((result) => {
      bot.sendMessage(msg.from.id, result.removed ?
        `*${result.feed.title}* 피드를 구독 해제 했습니다. /subscribe 명렁으로 다시 구독하실 수 있습니다. T0T` :
        `${result.message || 'crying! An error occurred on the server. Please try again later. Sorry for the inconvenience ㅠ _ ㅠ'}`
      , { parse_mode: 'Markdown' });
    }).catch((e) => {
      log(e.stack);
      bot.sendMessage(msg.from.id, 'crying! An error occurred on the server. Please try again later. Sorry for the inconvenience ㅠ _ ㅠ');
    })

  });
};
