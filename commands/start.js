'use strict';
/**
 * Module dependencies.
 */
const
  Promise   = require('bluebird'),
  debug     = require('debug'),
  mongoose  = require('mongoose'),
  User      = mongoose.model('User');


const
  log       = debug('telegrambot-reanderman:command:start');


const
  findOrCreateUser = (from) => {
    return new Promise((resolve, reject) => {
      User.findOne({
        id: from.id
      }).exec((e, user) => {
        if (e) { return reject(e); }

        if (user) {
          return resolve(user);
        }

        User.create({
          id: from.id,
          firstName: from.first_name,
          lastName: from.last_name
        }, (e, user) => {
          if (e) { return reject(e); }

          resolve(user);
        })
      });
    });
  };

module.exports = exports = (bot) => {
  bot.onText(/\/start/, (message) => {
    findOrCreateUser(message.from).then(() => {
      bot.sendMessage(message.from.id, '안녕하세요! 다음 명령어로 RSS봇을 시작해보세요!', {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['/help'],
            ['/subscribe'],
            ['/read'],
            ['/list'],
            ['/unsubscribe']
          ]
        })
      });
    }).catch((e) => {
      log(e.stack);
      bot.sendMessage(message.from.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
    });
  });
};