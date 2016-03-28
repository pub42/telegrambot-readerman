'use strict';


/**
 * Module dependencies.
 */
const
  _         = require('underscore'),
  mongoose  = require('mongoose'),
  User      = mongoose.model('User'),
  Subscribe = mongoose.model('Subscribe');


const
  getSubscribedFeeds = (from) => {
    return new Promise((resolve, reject) => {
      User.findOne({
        id: from.id
      }).exec((e, user) => {
        if (e) { return reject(e); }
        if (!user) { return reject(new Error(`Empty user id ${from.id}`)); }

        Subscribe.find({
          user: user._id
        }).populate('feed')
        .exec((e, subscribes) => {
          if (e) { return reject(e); }

          resolve(_.pluck(subscribes, 'feed'));
        });
      });
    });
  };

module.exports = exports = (bot) => {
  bot.onText(/\/list/, (message) => {
    getSubscribedFeeds(message.from).then((feeds) => {
      return bot.sendMessage(message.from.id, feeds.length ?
        `${feeds.length}개의 피드를 구독 중입니다.\n\n${feeds.map((feed) => `${feed.number} - ${feed.title}\n${feed.url}`).join('\n')}` :
        '구독 중인 피드가 없습니다. +0+');
    }).catch((e) => {
      console.error(e.stack);
      bot.sendMessage(message.from.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
    })
  });
};