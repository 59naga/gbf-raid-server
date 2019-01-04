import createIoClient from "socket.io-client";

const port = process.env.PORT || 8080;

createIoClient(`http://localhost:${port}/`)
  .emit("gbf-raid-server:cache", (error, tweets) => {
    console.log(tweets.slice(0, 10));
    // [{id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', createdAt: '2018-07-06 10:26:56'}, {...}]
  })
  .on("gbf-raid-server:tweet", tweet => {
    console.log(tweet);
    // {id: '451A60CE', name: 'Lv100 ティアマト・マグナ＝エア', createdAt: '2018-07-06 10:26:56'}
  });
