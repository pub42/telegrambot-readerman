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
              message: '입력하신 피드로 구독중인 내역이 없습니다! 0_0'
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
      return bot.sendMessage(msg.from.id, '피드 넘버 혹은 URL을 입력해주세요. 피드 넘버는 /list 명령을 통해 확인할 수 있습니다.');
    }

    unsubscribe(msg.from, match[1])
    .then((result) => {
      bot.sendMessage(msg.from.id, result.removed ?
        `*${result.feed.title}* 피드를 구독 해제 했습니다. /subscribe 명렁으로 다시 구독하실 수 있습니다. T0T` :
        `${result.message || '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ'}`
      , { parse_mode: 'Markdown' });
    }).catch((e) => {
      log(e.stack);
      bot.sendMessage(msg.from.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
    })

  });
};