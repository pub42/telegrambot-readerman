'use strict';

/**
 * Module dependencies.
 */
const
  mongoose        = require('mongoose'),
  User            = mongoose.model('User'),
  Feed            = mongoose.model('Feed'),
  Subscribe       = mongoose.model('Subscribe'),
  fetch           = require('../lib/fetch');


const
  findOrCreateFeed = (url, fetched) => {
    return new Promise((resolve, reject) => {
      Feed.findOne({
        url: url
      }).exec((e, feed) => {
        if (e) { return reject(e); }

        if (feed) { return resolve(feed); }

        Feed.create({
          url: url,
          title: fetched.meta.title,
          lastModified: fetched.meta.updatedAt,
          lastRecordLink: (fetched.records && fetched.records.length) ? fetched.records[0].link : null
        }, (e, feed) => {
          if (e) { return reject(e); }

          resolve(feed);
        });
      });
    });
  },
  subscribeFeed = (from, feed) => {
    return new Promise((resolve, reject) => {
      User.findOne({
        id: from.id
      }).exec((e, user) => {
        if (e) { return reject(e); }
        if (!user) { return reject(new Error(`Can't find user ${from.id}`)); }

        Subscribe.findOne({
          user: user._id,
          feed: feed._id
        }).exec((e, subscribe) => {
          if (e) { return reject(e); }

          if (subscribe) {
            subscribe.alreadyCreated = true;
            return resolve(subscribe);
          }

          Subscribe.create({
            user: user._id,
            feed: feed._id
          }, (e, subscribe) => {
            if (e) { return reject(e); }

            resolve(subscribe);
          });
        });
      });
    });
  };

module.exports = exports = (bot) => {

  const validateUrl = (url, message, done) => {
    if (!url) {
      return askUrl(message, done);
    }

    fetch(url).then((feed) => {
      done(url, feed, message);
    }).catch((e) => {
      console.error(e.stack);
      bot.sendMessage(message.from.id, '올바르지 않은 URL이거나, 피드가 존재하지 않습니다.');
    });
  };

  const askUrl = (message, done) => {
    bot.sendMessage(message.from.id, '추가할 피드의 URL을 알려주세요.', {
      reply_markup: JSON.stringify({
        force_reply: true
      })
    }).then((sended) => {
      bot.onReplyToMessage(sended.chat.id, sended.message_id, (message) => validateUrl(message.text, message, done));
    });
  };


  bot.onText(/\/subscribe(?: (.+))?/, (msg, match) => {
    validateUrl(match[1], msg, (url, feed, message) => {
      findOrCreateFeed(url, feed).then((feed) => {
        return subscribeFeed(message.from, feed);
      }).then((subscribe) => {
        bot.sendMessage(message.from.id, subscribe.alreadyCreated ?
          `*${feed.meta.title}* 피드는 이미 구독중입니다.` :
          `*${feed.meta.title}* 피드를 구독합니다.\n/read 명령어를 통해 피드의 글을 즉시 확인할 수도 있습니다.`, {
          parse_mode: 'Markdown'
        });
      }).catch((e) => {
        console.error(e.stack);
        bot.sendMessage(message.from.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
      });
    });
  });

};