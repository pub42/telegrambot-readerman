'use strict';

/**
 * Module dependencies.
 */

const
  Promise         = require('bluebird'),
  path            = require('path'),
  mongoose        = require('mongoose'),
  autoIncrement   = require('mongoose-auto-increment'),
  debug           = require('debug'),
  dotenv          = require('dotenv'),
  requireDir      = require('require-dir'),
  _               = require('underscore'),
  TelegramBot     = require('node-telegram-bot-api');

/**
 * Application specific configurations.
 */
debug.enable('telegrambot-reanderman:ad');

const
  log               = debug('telegrambot-reanderman:ad'),
  env               = process.env;

dotenv.load({
  path: path.join(__dirname, '.env')
});

_.defaults(env, {
  NODE_ENV: 'development',
  PORT: 9000
});

const
  message = [
    '[로톡 바로가기](https://www.lawtalk.co.kr/tg1)'
  ].join('\n');


/**
 * Creates an Application.
 */
const db      = mongoose.connect(process.env.MONGO_URL, { options: { db: { safe: true } } }, (e) => {
  if (e) throw e;

  log('Connected to mongodb.');

  mongoose.set('debug', process.env.NODE_ENV === "development");
  autoIncrement.initialize(db);

  // Bootstrap models
  requireDir('./models');
  log('Bootstrapped models.');

  const
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
      webHook: false,
      polling: false
    });

  log('Created bot. Getting Users...');

  // Bootstrap commands
  const User = mongoose.model('User');

  User.find()
  .exec((e, users) => {
    log('Fetched %d users', users.length);

    Promise.map(users.map((user) => user.id), (id) => {
      console.log("MESSAGE");
      /* return bot.sendMessage(id, message, {
        parse_mode: 'Markdown'
      }).then(() => {
        return Promise.resolve(true);
      }).catch((e) => {
        console.error(e);
        return Promise.resolve(false);
      });
      */
    }, {concurrency: 10}).then((results) => {
      log('sent: %d, failed: %d', results.filter((x) => x).length, results.filter((x) => !x).length);
      process.exit(0);
    });
  });
});
