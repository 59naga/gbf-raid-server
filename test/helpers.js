import assert from 'assert';
import EventEmitter from 'events';
import createIoClient from 'socket.io-client';
import createIoServer from 'socket.io';
import statuses from './statuses';
import createRaidServer from '../src';

export const createClient = port => (
  createIoClient(`http://localhost:${port}`, { forceNew: true })
);
export const createRaidServerTest = (server, opts = {}) => {
  const raidServer = createRaidServer('', {
    ...opts,
    debug: {
      twitter: {
        get(endpoint, params, callback) {
          assert(endpoint === 'search/tweets');
          assert(params.q === raidServer.opts.keywordSearch);
          setImmediate(() => {
            callback(null, { statuses: statuses.slice(0, params.count) });
          });
        },
      },
      stream: new EventEmitter(),
    },
  });

  return raidServer.subscribe(createIoServer(server));
};
