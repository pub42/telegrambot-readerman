'use strict';

/**
 * Module dependencies.
 */

const
  mongoose  = require('mongoose'),
  debug     = require('debug'),
  Message   = mongoose.model('Message');

const
  log       = debug('telegrambot-reanderman:log');

module.exports = exports = (bot) => {
  bot.onText(/(.*)/, (msg) => {
    /*
     messageId: Number,
     from: {
     id: Number,
     firstName: String,
     lastName: String,
     type: String
     },
     date: Date,
     text: String
     */
    Message.create({
      messageId: msg.message_id,
      from: {
        id: msg.from.id,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        type: msg.from.type
      },
      date: new Date(msg.date * 1000),
      text: msg.text
    }, (e) => {
      if (e) { return log(e); }
    });
  });
};