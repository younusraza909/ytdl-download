const ytdl = require("ytdl-core");
const fs = require("fs");

exports.getVideoInfo = async (req, res) => {
  try {
    const videoUrl = req.query.url; // Get video URL from request query parameter

    if (!videoUrl) {
      return res.status(400).json({ message: "Missing video URL" });
    }

    const info = await ytdl.getInfo(videoUrl);

    // Extract relevant information for the frontend
    const availableFormats = info.formats.map((format) => ({
      itag: format.itag,
      mimeType: format.mimeType,
      container: format.container,
      audioBitrate: format.audioBitrate,
      videoBitrate: format.videoBitrate,
      height: format.height,
      width: format.width,
      approxSize: format.approxSize,
    }));

    res.status(200).json({ availableFormats, info });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching video information" });
  }
};

exports.downloadVideo = async (req, res) => {
  const videoUrl = req.query.url;
  const videoTag = req.query.itag;
  const videoFormat = req.query.format;

  if (!videoUrl) {
    return res.status(400).json({ message: "Missing video URL" });
  }
  const info = await ytdl.getInfo(videoUrl);

  ytdl.downloadFromInfo(info, { quality: videoTag });

  const outputFilePath = `${info.videoDetails.title}.${videoFormat}`;
  const outputStream = fs.createWriteStream(outputFilePath);

  const videoStream = ytdl.downloadFromInfo(info, { quality: videoTag });

  res.writeHead(200, {
    "Content-Type": "application/json",
  });

  videoStream.pipe(outputStream);

  const format = info.formats.filter(
    (video) => video.itag === Number(videoTag)
  )[0];

  if (!format || format.length === 0) {
    res.status(404).json({ message: "Format not found" });
  }

  let downloadedBytes = 0;
  const totalBytes = +format?.contentLength;

  const calculateProgress = () => {
    if (totalBytes) {
      const progress = (downloadedBytes / totalBytes) * 100;
      return progress.toFixed(2) + "%";
    } else {
      return "Downloading...";
    }
  };

  videoStream.on("data", (chunk) => {
    downloadedBytes += chunk.length;
    const progress = calculateProgress();

    res.write(JSON.stringify({ progress: progress }));
  });

  outputStream
    .on("finish", () => {
      console.log("Finish");
      res.end();
    })
    .on("error", (error) => {
      console.error(error);
      console.log("E rror");
      res.status(500).json({ message: "Error downloading video" });
    });
};
