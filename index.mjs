import { createServer } from 'http';
import createIoServer from 'socket.io';
import createRaidServer, { parseAll } from 'gbf-raid-server/mjs';

const port = process.env.PORT || 8080;

const raidServer = createRaidServer(process.env.GBFR_KEYS);
const server = createServer((req, res) => {
  res.writeHead(302, { Location: 'https://github.com/59naga/gbf-raid-server' });
  res.end();
});

server.listen(port, async () => {
  raidServer.setCache(parseAll(await raidServer.fetch()));
  raidServer.subscribe(createIoServer(server));
});
