import { createServer } from "http";
import { createServer as createSecureServer } from "https";
import { readFileSync } from "fs";
import createIoServer from "socket.io";
import createRaidServer, { parseAll } from "gbf-raid-server/mjs";

import express from "express";
import request from "request";
import cors from "cors";

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
app.use(cors());
app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(raidServer.cache, null, 2));
});
app.get("/fetch-image", (req, res) => {
  request(req.query.url, (error, response) => {
    if (error) {
      return res.status(500).json(error);
    }
    const media = response.body.match(
      /https:\/\/pbs.twimg.com\/media\/[\w\.]+/
    );
    res.json(media ? media[0] : null);
  });
});

const key = readFileSync(".key.pem");
const cert = readFileSync(".cert.pem");
const server = createSecureServer({ key, cert }, app);

const listener = server.listen(port, async () => {
  raidServer.setCache(parseAll(await raidServer.fetch()));
  raidServer.subscribe(createIoServer(server));

  const { address, port } = listener.address();
  const schema = server.key ? "https" : "http";
  console.log(`${schema}://${address}:${port}`);
});

if (port == 443) {
  createServer(
    express().all("*", function(request, response) {
      response.redirect(302, `https://gbf-raid-stream.now.sh`);
      // response.redirect(302, `https://${request.hostname}${request.url}`);
    })
  ).listen(80);
}
