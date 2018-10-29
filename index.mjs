import http from "http";
import createIoServer from "socket.io";
import createRaidServer, { parseAll } from "gbf-raid-server/mjs";

const port = process.env.PORT || 8080;

let timeout;
const raidServer = createRaidServer(process.env.GBFR_KEYS, {
  onTweet: () => {
    // 30分経過しても新しいtweetが受信出来ない場合、streamが切れてるのでプロセスを再起動する
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      throw new Error("stream timed out, rebooting");
    }, 30 * 60 * 1000);
  }
});
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(raidServer.cache, null, 2));
});

server.listen(port, async () => {
  raidServer.setCache(parseAll(await raidServer.fetch()));
  raidServer.subscribe(createIoServer(server));
});
