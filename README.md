# telegrambot-readerman
[![Dependency Status](https://david-dm.org/mooyoul/telegrambot-readerman.svg)](https://david-dm.org/mooyoul/telegrambot-readerman) [![Known Vulnerabilities](https://snyk.io/test/github/mooyoul/telegrambot-readerman/badge.svg)](https://snyk.io/test/github/mooyoul/telegrambot-readerman) [![MIT license](http://img.shields.io/badge/license-MIT-blue.svg)](http://mooyoul.mit-license.org/)

Telegram Bot API를 사용하는 RSS 피드 봇

## Requirements

* Node.js >= 4
* MongoDB >= 3
* Telegram Bot API Key

## Getting Started
```bash
$ git clone https://github.com/mooyoul/telegrambot-readerman.git
$ cd telegrambot-readerman
$ npm install
$ cp .env.example .env
$ vi .env # You must edit configurations!
```

### Running server
```bash
$ node server.js
```

### Registering feed sync worker
주기적인 피드 싱크를 위해 Cron에 아래 명령어를 Job으로 등록하기만 하면 됩니다.

```bash
flock -xn /home/web/cron/sync.lock -c env NODE_ENV=production node $REPO_PATH/sync.js
```

이렇게요:

```bash
$ # Run sync worker every 5 minutes
$ # */5 * * * * flock -xn /tmp/sync.lock -c env NODE_ENV=production node $REPO_PATH/sync.js
$ crontab -e
```

`flock`을 사용해서 sync job은 오직 하나만 실행할 수 있게 설정하는 것을 권장합니다.


## Known Issues
현재 다음과 같은 알려진 이슈가 있습니다:

##### 간헐적으로 Markdown format이 망가짐
Markdown syntax가 포함된 제목이나 본문이 있는 경우, Telegram API로 전송하는 Markdown format이 망가지면서 본문이 망가지거나 Telegram API에서 요청을 거절하는 경우가 발생합니다

##### 쎈호스팅의 팟캐스트 호스팅 서비스에서 차단 당할 수 있음
주기적으로 피드를 요청해서 그런지는 모르겠으나 쎈호스팅에서 호스팅되는 팟캐스트들 (e.g. `pod.ssenhosting.com` 호스트를 사용하는 일부 팟빵 RSS)의 경우
쎈호스팅 서버측에서 Content-Length가 0인 헤더와 함께 빈 응답이 날아옵니다.

User-Agent를 변경하는 방법을 사용해도 결과가 동일한 것을 보면 IP 레벨로 차단을 하는 것으로 추측됩니다

##### 그룹 채팅방에서 사용할 수 없음
현재 코드가 RSS 봇의 채팅방에서만 동작하도록 작성되어 있어 그룹 채팅방에서는 사용할 수 없는 문제가 있습니다.



## License
[MIT](LICENSE)

See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)