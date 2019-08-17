'use strict';

/**
 * Module dependencies.
 */
const
  debug           = require('debug'),
  mongoose        = require('mongoose'),
  User            = mongoose.model('User'),
  Feed            = mongoose.model('Feed'),
  Subscribe       = mongoose.model('Subscribe'),
  fetch           = require('../lib/fetch');

const
  log             = debug('telegrambot-reanderman:command:subscribe');


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
      log(e.stack);
      bot.sendMessage(message.from.id, 'Invalid URL or feed does not exist.');
    });
  };

  const askUrl = (message, done) => {
    bot.sendMessage(message.from.id, 'Please provide the URL of the feed you want to add.', {
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
          `*${feed.meta.title}* The feed is already subscribed.` :
          `*${feed.meta.title}* Subscribe to the feed.\n/readYou can also read the feed's post immediately.`, {
          parse_mode: 'Markdown'
        });
      }).catch((e) => {
        log(e.stack);
        bot.sendMessage(message.from.id, 'crying! An error occurred on the server. Please try again later. Sorry for the inconvenience ㅠ _ ㅠ');
      });
    });
  });

};
