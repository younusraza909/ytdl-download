const express = require("express");
const { getVideoInfo, downloadVideo } = require("./controller/youtube");

const app = express();

const port = 3000;

app.get("/api/video/info", getVideoInfo);
app.get("/api/video/download", downloadVideo);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
