// @flow
import assert from 'assert';
import { createServer } from 'http';
import enableDestroy from 'server-destroy';
import { parse, parseAll } from '../src';
import { createClient, createRaidServerTest } from './helpers';
import statuses from './statuses';

const port = 8080;

const expectedTweets = [{
  id: '53932FF8',
  name: 'Lv100 ユグドラシル・マグナ',
  memo: 'ゆぐゆぐ',
  urlOrigin: 'twitter.com/horse_n_game_gf/status/1016184844852711424',
  urlProfile: 'https://pbs.twimg.com/profile_images/1012078253467549696/u18ADeiA_normal.jpg',
  createdAt: '2018-07-09 13:58:41',
}, {
  id: '20238320',
  name: 'Lvl 90 Agni',
  memo: 'HELPP PLEASEEE',
  urlOrigin: 'twitter.com/lois66258372/status/1017197262777114624',
  urlProfile: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
  createdAt: '2018-07-09 13:58:41',
}, {
  id: '6A749D96',
  name: 'Lv90 テスカトリポカ',
  memo: '',
  urlOrigin: 'twitter.com/p2ashiuragb/status/1018854363563843585',
  urlProfile: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
  createdAt: '2018-07-16 22:58:41',
}];

describe('.parse', () => {
  it('twitter/statusオブジェクトを出力用の１次元オブジェクトに変換すべき', () => {
    assert.deepEqual(parse(statuses[0]), expectedTweets[0]);
    assert.deepEqual(parse(statuses[1]), expectedTweets[1]);
    assert.deepEqual(parse(statuses[2]), expectedTweets[2]);
  });
});

describe('RaidServer', () => {
  let server: any;
  let client;
  before((done) => {
    server = createServer();
    enableDestroy(server);
    server.listen(port, done);
  });
  afterEach(() => {
    client.disconnect();
  });
  after((done) => {
    server.destroy(done);
  });

  describe('.subscribe', () => {
    it('twitter.streamからdataを受信したら全てのclientへtweetイベントを送信すべき', (done) => {
      const raidServer = createRaidServerTest(server);

      client = createClient(port);
      client
        .once('connect', () => {
          raidServer.stream.emit('data', statuses[0]);
        })
        .on('gbf-raid-server:tweet', (tweet) => {
          assert.deepEqual(tweet, expectedTweets[0]);
          assert.deepEqual(raidServer.cache[0], expectedTweets[0]);

          done();
        });
    });
    it('無関係のツイートを無視するべき(#1)', (done) => {
      const raidServer = createRaidServerTest(server);
      const expectedIgnore = Object.assign({}, statuses[0], { text: 'Lorem i need backup' });

      client = createClient(port);
      client
        .once('connect', () => {
          raidServer.stream.emit('data', expectedIgnore);
          setTimeout(done, 100);
        })
        .on('gbf-raid-server:tweet', ({ id, name }) => {
          done(new Error(`unexpected tweet: ${id},${name}`));
        });
    });
    it('ツイートがもつidは一意であるべき(#3)', (done) => {
      const raidServer = createRaidServerTest(server);
      raidServer.stream.emit('data', statuses[0]);
      raidServer.stream.emit('data', statuses[0]);
      raidServer.stream.emit('data', statuses[0]);

      client = createClient(port);
      client
        .emit('gbf-raid-server:cache', (error, tweets) => {
          assert(error === null);
          assert(tweets.length === 1);

          done();
        });
    });

    describe('.setCache', () => {
      it('clientの`cache`イベントに対しcacheを返すべき', async () => {
        const raidServer = createRaidServerTest(server);
        raidServer.setCache(parseAll(await raidServer.fetch()));

        return new Promise((resolve) => {
          client = createClient(port);
          client
            .emit('gbf-raid-server:cache', (error, tweets) => {
              assert(error === null);
              assert(tweets.length === statuses.length);

              resolve();
            });
        });
      });
    });
  });

  describe('.fetch', () => {
    it('指定件数のオブジェクトを取得するべき', async () => {
      const raidServer = createRaidServerTest();
      const count = 5;
      const data = await raidServer.fetch(count);
      assert(data.length === count);
    });
  });
});
