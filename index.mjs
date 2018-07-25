import http from 'http';
import createIoServer from 'socket.io';
import createRaidServer, { parseAll } from 'gbf-raid-server/mjs';

const port = process.env.PORT || 8080;

const raidServer = createRaidServer(process.env.GBFR_KEYS);
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(raidServer.cache, null, 2));
});

server.listen(port, async () => {
  raidServer.setCache(parseAll(await raidServer.fetch()));
  raidServer.subscribe(createIoServer(server));
});
