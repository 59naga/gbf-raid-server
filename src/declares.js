// @flow
import type EventEmitter from 'events';

// 使用するモジュールに定義がない場合、以下のようにしてエラーを握り潰す
// 参考:
// https://qiita.com/mizchi/items/95ee0101ac22e4b7b662
// https://github.com/facebook/flow/issues/2249#issuecomment-239748038
declare module 'twitter' {
  declare class Twitter {
    constructor<TwitterKeys>(keys: TwitterKeys): void;
    get(string, {}, Function): void;
    stream(string, {}): EventEmitter;
  }
  declare type TwitterKeys = {
    consumer_key: string,
    consumer_secret: string,
    access_token_key: string,
    access_token_secret: string,
  }

  declare module.exports: Class<Twitter>;
}

declare module 'moment-timezone' {
  declare module.exports: Function;
}

declare module 'socket.io' {
  declare module.exports: Function;
}
