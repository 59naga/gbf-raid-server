https://gbf-raid-server.herokuapp.com/
---

```js
import createIoClient from 'socket.io-client';

createIoClient('https://gbf-raid-server.herokuapp.com/')
  .emit('gbf-raid-server:cache', (error, tweets) => {
    console.log(tweets);
    // [{id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', createdAt: '2018-07-06 10:26:56'}, {...}]
  })
  .on('gbf-raid-server:tweet', (tweet) => {
    console.log(tweet);
    // {id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', createdAt: '2018-07-06 10:26:56'}
  });
```

デプロイ方法
---

```bash
git init
heroku accounts:set gbf-raid-server
heroku create gbf-raid-server
git add -A
git commit -m initial

# herokuの管理画面へアクセスして環境変数をGBFR_KEYSをセット

git push -u heroku master

# https://gbf-raid-server.herokuapp.com/ でアクセス可能
```
