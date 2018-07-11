// @flow
import assert from 'assert';
import { createServer } from 'http';
import { parse, parseAll } from '../src';
import { createClient, createRaidServerTest } from './helpers';
import statuses from './statuses';

const port = 8080;

const expectedTweet = {
  id: '53932FF8',
  name: 'Lv100 ユグドラシル・マグナ',
  memo: 'ゆぐゆぐ',
  urlOrigin: 'twitter.com/horse_n_game_gf/status/1016184844852711424',
  urlProfile: 'https://pbs.twimg.com/profile_images/1012078253467549696/u18ADeiA_normal.jpg',
  createdAt: '2018-07-09 13:58:41',
};

describe('.parse', () => {
  it('twitter/statusオブジェクトを出力用の１次元オブジェクトに変換すべき', () => {
    const tweet = parse(statuses[0]);

    assert.deepEqual(tweet, expectedTweet);
  });
});

describe('RaidServer', () => {
  let server;
  let client;
  before((done) => {
    server = createServer();
    server.listen(port, done);
  });
  afterEach(() => {
    client.disconnect();
  });
  after(() => {
    server.close(); // not use `done()` cause sometimes not callback
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
          assert.deepEqual(tweet, expectedTweet);
          assert.deepEqual(raidServer.cache[0], expectedTweet);

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
          setTimeout(done, 300);
        })
        .on('gbf-raid-server:tweet', ({ id, name }) => {
          done(new Error(`unexpected tweet: ${id},${name}`));
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
