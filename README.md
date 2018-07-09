gbf-raid-server
---

<p align="right">
  <a href="https://www.npmjs.com/package/gbf-raid-server">
    <img alt="Npm version" src="https://badge.fury.io/js/gbf-raid-server.svg">
  </a>
  <a href="https://travis-ci.org/59naga/gbf-raid-server">
    <img alt="Build Status" src="https://travis-ci.org/59naga/gbf-raid-server.svg?branch=master">
  </a>
</p>

[node-twitter][2]と[socket.io][3]のグルーコードをグラブル用に調整し、クラスと関数で提供します。

```bash
# export GBFR_KEYS=consumer_key:consumer_secret:access_token_key:access_token_secret
# node --experimental-modules app.mjs
```

```js
import { createServer } from 'http';
import createIoServer from 'socket.io';
import createIoClient from 'socket.io-client';
import createRaidServer, { parseAll } from 'gbf-raid-server/mjs';

const port = process.env.PORT || 8080;

const raidServer = createRaidServer(process.env.GBFR_KEYS);
const server = createServer();

server.listen(port, async () => {
  raidServer.setCache(parseAll(await raidServer.fetch()));
  raidServer.subscribe(createIoServer(server));

  createIoClient(`http://localhost:${port}`)
    .emit('gbf-raid-server:cache', (error, tweets) => {
      console.log(tweets);
      // [{id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', memo: '毎秒チョクチェしろ', createdAt: '2018-07-06 10:26:56'}, {...}]
    })
    .on('gbf-raid-server:tweet', (tweet) => {
      console.log(tweet);
      // {id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', memo: '毎秒チョクチェしろ', createdAt: '2018-07-06 10:26:56'}
    });
});
```

インストール
---

```bash
npm install gbf-raid-server
# or
yarn add gbf-raid-server
```

API
---

## `createRaidServer(TWITTER_OAUTH_KEYS, Options={}): raidServer`

第一引数に[twitter-api](https://apps.twitter.com/)の各4キーを`:`で連結して文字列で渡し、`raidServer`インスタンスを返します。

```js
const raidServer = createRaidServer('consumer_key:consumer_secret:access_token_key:access_token_secret');
```

## `raidServer.subscribe(ioServer): this`

第一引数を`socket.io`インスタンスとして

* `server`に`gbf-raid-server:cache`イベントを設定します。このイベントが`client`から送られると、`server`はコールバック関数の第二引数に即座にキャッシュを渡します。
  ```js
  createIoClient(`http://localhost:${port}`)
    .emit('gbf-raid-server:cache', (error, tweets) => {
      console.log(tweets);
      // [{id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', createdAt: '2018-07-06 10:26:56'}, {...}]
    })
  ```
* `client`へ`gbf-raid-server:tweet`イベントを送信します。このイベントは[streaming-api](https://github.com/desmondmorris/node-twitter#streaming-api)によって、救援ツイート１つにつき１イベントリアルタイムで発生します
  ```js
  createIoClient(`http://localhost:${port}`)
    .on('gbf-raid-server:tweet', (tweet) => {
      console.log(tweet);
      // {id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', createdAt: '2018-07-06 10:26:56'}
    });
  ```

## `raidServer.setCache(Tweet[]): this`

サーバーのキャッシュを第一引数に変更します。`client`がサービスにアクセス時、過去のツイートを確認するために必要です。
`.fetch`を利用して定期的に更新してください。

## `raidServer.fetch(count = 100): Promise<Statuses[]>`

過去のツイートを`Promise`で取得します。返されるデータには救援データと関係のないメタ情報が多量に含まれるので、`parseAll`関数などで抽出してください。

## `parseAll(Statuses[]): Tweet[]`

`raidServer.fetch`で取得したツイートのメタ情報を削除して新しい配列を返します。

```js
parseAll(await raidServer.fetch());
// [{id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', memo: '毎秒チョクチェしろ', createdAt: '2018-07-06 10:26:56'}, {...}]
```

開発環境
---

下記がグローバルインストールされていることが前提です。

* NodeJS v10.6.0
* Yarn v1.8.0

```bash
git clone git@github.com:59naga/gbf-raid-server.git
cd gbf-raid-server

yarn
yarn test
```

Lincense
---
MIT

[1]: https://developer.twitter.com/en/docs/basics/rate-limits.html
[2]: https://github.com/desmondmorris/node-twitter#readme
[3]: https://github.com/socketio/socket.io#readme
