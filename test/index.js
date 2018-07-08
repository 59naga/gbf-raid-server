// @flow
import assert from 'assert';
import { createServer } from 'http';
import createIoServer from 'socket.io';
import { parse, parseAll } from '../src';
import { createClient, createRaidServerTest } from './helpers';
import statuses from './statuses';

const port = 8080;

const expectedTweet = {
  id: '5ECB700C',
  name: 'Lv120 グリームニル',
  urlOrigin: 'twitter.com/ao___779/status/1015993204510822400',
  urlProfile: 'https://pbs.twimg.com/profile_images/954332873426808832/mB5SXA3d_normal.jpg',
  createdAt: '2018-07-09 01:17:10',
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
      const raidServer = createRaidServerTest().subscribe(createIoServer(server));

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

    describe('.setCache', () => {
      it('clientの`cache`イベントに対しcacheを返すべき', async () => {
        const raidServer = createRaidServerTest().subscribe(createIoServer(server));
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
