// @flow
import Twitter from 'twitter';
import moment from 'moment-timezone';
import type EventEmitter from 'events';

export type Status = {
  text: string,
  id_str: string,
  user: {
    id: string,
    screen_name: string,
    profile_image_url_https: string,
  },
  created_at: string,
}
export type Tweet = {|
  id: string,
  name: string,
  memo: string,
  urlOrigin: string,
  urlProfile: string,
  createdAt: string,
|}
export type Options ={
  prefix?: string,
  cacheLimit?: number,
  addStreamToCache?: boolean,
  keywordSearch?: string,
  keywordStream?: string,
  debug?: {
    twitter: Twitter,
    stream: EventEmitter,
  }
}

export function parse(status: Status): Tweet {
  const texts = status.text.split('\n');
  const matches = texts[0].match(/(.*?)([\d\w]{8}) :(?:Battle ID|参戦ID)/) || [];

  const id = matches[2] || '';
  const memo = (matches[1] || '').trim();
  const name = texts.slice(-2)[0];
  const urlOrigin = `twitter.com/${status.user.screen_name}/status/${status.id_str}`;
  const urlProfile = status.user.profile_image_url_https;
  const createdAt = moment(new Date(status.created_at)).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');

  return { id, name, memo, urlOrigin, urlProfile, createdAt };
}
export function parseAll(statuses: Status[]): Tweet[] {
  return statuses.map(status => parse(status));
}

export function unshiftUnique(origin: Tweet[], data: Tweet) {
  const items: Tweet[] = origin.filter(item => item.id !== data.id);
  items.unshift(data);
  return items;
}

export class RaidServer {
  cache: Tweet[];
  opts: Options;
  twitter: Twitter;
  stream: EventEmitter;
  constructor(KEYS: string, options: Options = {}) {
    this.cache = [];
    this.opts = {
      ...{
        prefix: 'gbf-raid-server',
        cacheLimit: 1000,
        addStreamToCache: true,
        keywordSearch: '"参戦ID 参加者募集！" OR "Battle ID I need backup!"',
        keywordStream: '参加者募集！,I need backup!',
      },
      ...options,
    };

    const keys = KEYS.split(':');
    const { keywordStream: track } = this.opts;
    if (options.debug) {
      this.twitter = options.debug.twitter;
      this.stream = options.debug.stream;
    } else {
      this.twitter = new Twitter({
        consumer_key: keys[0],
        consumer_secret: keys[1],
        access_token_key: keys[2],
        access_token_secret: keys[3],
      });
      this.stream = this.twitter.stream('statuses/filter', { track });
    }
  }

  subscribe(io: EventEmitter): this {
    const prefix = this.opts.prefix || '';
    io.on('connection', (socket) => {
      socket.on(`${prefix}:cache`, (callback) => {
        callback(null, this.cache);
      });
    });

    const addStreamToCache = !!this.opts.addStreamToCache;
    const cacheLimit = this.opts.cacheLimit || 0;
    this.stream.on('data', (status: Status) => {
      const tweet = parse(status);
      if (tweet.id === '' || tweet.name === '') {
        return;
      }
      if (addStreamToCache) {
        this.cache = unshiftUnique(this.cache, tweet);
        if (this.cache.length > cacheLimit) {
          this.cache.length = cacheLimit;
        }
      }
      io.emit(`${prefix}:tweet`, tweet);
    });
    return this;
  }

  setCache(tweets: Tweet[]): this {
    this.cache = tweets;
    return this;
  }

  fetch(count: ?number = this.opts.cacheLimit): Promise<Status[]> {
    return new Promise((resolve, reject) => {
      // https://developer.twitter.com/en/docs/basics/rate-limits.html
      // 180req/15min = 12req/1min = 1req/5sec
      const { keywordSearch: q } = this.opts;
      const params = { q, count };
      this.twitter.get('search/tweets', params, (error, { statuses }: {statuses: Status[]}) => {
        if (error) {
          reject(error);
        } else {
          resolve(statuses);
        }
      });
    });
  }
}

export default (...args: any) => new RaidServer(...args);
