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
    '업데이트 내역이 있어서 이렇게 메세지로 찾아뵙게 되었습니다!',
    '',
    '*4/6 업데이트 내역*',
    '- AWS Seoul Region으로 이전',
    '- UTF-8 이외의 인코딩 (e.g. EUC-KR)을 사용하는 피드 지원',
    '나라일터와 같은 공공기관 RSS 피드도 이제 잘 읽어요!',
    '- Atom 피드 지원',
    'Github의 RSS 피드로 테스트 완료!',
    '- 메모리 누수로 인해 RSS 피드가 싱크되지 않는 버그 수정',
    '그래서 알람이 안갔습니다! 죄송합니다 ㅠ_ㅠ',
    '',
    '혹시라도 사용 도중 기능이 제대로 동작하지 않거나 불편하신 사항이 있으시다면 [@mooyoul](https://telegram.me/mooyoul)계정으로 메세지를 남겨주시면 감사하겠습니다.',
    '[친구추가 바로가기](https://telegram.me/mooyoul)',
    '그럼, 오늘도 좋은 하루 되시길 바랍니다. 감사합니다!'
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