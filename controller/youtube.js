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

    res.status(200).json({ availableFormats });
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
  videoStream.pipe(outputStream);

  let downloadedBytes = 0;
  let totalBytes = parseInt(info.videoDetails.lengthSeconds) * 1000000;

  videoStream.on("data", (chunk) => {
    downloadedBytes += chunk.length;
    const progress = (downloadedBytes / totalBytes) * 100;
    console.log(JSON.stringify({ progress: progress.toFixed(2) + "%" }));
    res.write(JSON.stringify({ progress: progress.toFixed(2) + "%" }));
  });

  outputStream
    .on("finish", () => {
      res.status(200).json({ message: "Video Downloaded Successfully" });
    })
    .on("error", (error) => {
      console.error(error);
      res.status(500).json({ message: "Error downloading video" });
    });
};
