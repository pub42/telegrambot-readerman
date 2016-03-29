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
debug.enable('telegrambot-reanderman:notify');

const
  log               = debug('telegrambot-reanderman:notify'),
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
    '*[공지]*',
    '안녕하세요 여러분, 개발자 Presott 입니다.',
    '먼저, 하루 만에 구독 피드 갯수가 100개를 돌파하는 모습을 보여주신 사용자분들께 진심으로 감사드립니다.',
    '업데이트 내역이 있어서 이렇게 메세지로 찾아뵙게 되었습니다!',
    '',
    '*3/20 업데이트 내역*',
    '- (일부 피드 대상) 피드가 갱신되었음에도 불구하고 알림을 보내지 않던 버그 수정',
    '- 소소한 성능 최적화',
    '',
    '혹시라도 사용 도중 기능이 제대로 동작하지 않거나 불편하신 사항이 있으시다면 KoreanTelegramBot 채널을 통해 알려주시면 감사하겠습니다.',
    '[KoreanTelegramBot 바로가기](https://telegram.me/KoreanTelegramBot)',
    '아울러, 오늘 *네이버지도 봇*이 릴리즈 될 예정입니다. 혹시라도 관심이 있으시다면, 클리앙의 팁과 강좌 게시판을 확인해주세요.',
    '그럼, 오늘도 좋은 하루 되시길 바랍니다. 좋은 밤 되세요!'
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
      return bot.sendMessage(id, message, {
        parse_mode: 'Markdown'
      }).then(() => {
        return Promise.resolve(true);
      }).catch((e) => {
        console.error(e);
        return Promise.resolve(false);
      });
    }, {concurrency: 10}).then((results) => {
      log('sent: %d, failed: %d', results.filter((x) => x).length, results.filter((x) => !x).length);
      process.exit(0);
    });
  });
});