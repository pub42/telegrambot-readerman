'use strict';


module.exports = exports = (bot) => {
  bot.onText(/\/help/i, (message) => {
    bot.sendMessage(message.from.id, [
      'RSS봇에는 다음 명령들이 있습니다.',
      '',
      '/subscribe [URL]',
      '- 지정된 RSS 피드를 구독합니다.',
      '',
      '/unsubscribe [URL|FEED_NUMBER]',
      '- 지정된 RSS 피드를 구독해제합니다.',
      '',
      '/list',
      '- 구독 중인 RSS 피드 목록을 가져옵니다.',
      '',
      '/read [URL|FEED_NUMBER]',
      '- 지정한 RSS 피드의 최신글을 즉시 가져옵니다. 피드가 입력되지 않으면, 전체 피드를 가져옵니다.',
      '/help',
      '- 이 메세지를 출력합니다.'
    ].join('\n'));
  });
};