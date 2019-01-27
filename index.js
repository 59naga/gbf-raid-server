import http from "http";
import createIoServer from "socket.io";
import createRaidServer, { parseAll } from "gbf-raid-server/mjs";
import express from "express";
import request from "request";

const port = process.env.PORT || 8080;

let timeout;
const raidServer = createRaidServer(process.env.GBFR_KEYS, {
  onTweet: () => {
    // 30分経過しても新しいtweetが受信出来ない場合、streamが切れてるのでプロセスを再起動する
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      throw new Error("stream timed out, rebooting");
    }, 10 * 60 * 1000);
  }
});

const app = express();
app.get("/fetch-image", async (req, res) => {
  request(req.query.url, (error, response) => {
    if (error) {
      return res.status(500).json(error)
    }
    const media = response.body.match(
      /https:\/\/pbs.twimg.com\/media\/[\w\.]+/
    );
    res.json(media ? media[0] : null);
  });
});
app.use(express.static('./gbf-raid-stream-dist'));

const server = http.createServer(app);

const listener = server.listen(port, async () => {
  raidServer.setCache(parseAll(await raidServer.fetch()));
  raidServer.subscribe(createIoServer(server));

  const { address, port } = listener.address();
  const schema = server.key ? "https" : "http";
  console.log(`${schema}://${address}:${port}`);
});
