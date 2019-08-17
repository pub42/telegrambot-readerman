'use strict';


module.exports = exports = (bot) => {
  bot.onText(/\/help/i, (message) => {
    bot.sendMessage(message.from.id, [
      'RSS reader',
      '',
      '/subscribe [URL]',
      '- Подписатся на канал.',
      '- Subscribe to the specified RSS feed.',
      '',
      '/unsubscribe [URL|FEED_NUMBER]',
      '- Удалить канал',
      '- Remove the specified RSS feed.',
      '',
      '/list',
      '- Список всех каналов',
      '- List all known RSS feed',
      '',
      '/read [URL|FEED_NUMBER]',
      'Получить последние сообщения из указанного RSS-канала немедленно. Если канал не введен, берется весь канал.',
      '- Receive the latest posts from the specified RSS feed immediately. If the channel is not entered, the entire channel is taken.',
      '',
      '/help',
      '- Это сообщение',
      '- This message'
    ].join('\n'));
  });
};
