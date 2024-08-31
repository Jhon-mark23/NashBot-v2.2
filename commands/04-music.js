const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
  name: "music",
  hasPermission: 0,
  version: "1.0.0",
  description: "Get music",
  usePrefix: true,
  credits: "Jonell Magallanes",
  cooldowns: 10,
  commandCategory: "Utility"
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) {
    return api.sendMessage(`❌ Please enter a music name!`, event.threadID);
  }

  try {
    const song = args.join(" ");
    const findingMessage = await api.sendMessage(`🔍 | Finding "${song}". Please wait...`, event.threadID);

    const searchResults = await yts(song);
    const firstResult = searchResults.videos[0];

    if (!firstResult) {
      await api.sendMessage(`❌ | No results found for "${song}".`, event.threadID);
      return;
    }

    const { title, author, duration, url } = firstResult;

    await api.editMessage(`⏱️ | Music info found: "${title}" by ${author.name}. Downloading...`, findingMessage.messageID);

    const response = await axios.get(`http://158.101.198.227:8224/yt?search=${encodeURIComponent(song)}`, {
      responseType: 'arraybuffer'
    });

    const fileSizeInBytes = Buffer.byteLength(response.data);
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

    if (fileSizeInMB > 25) {
      await api.sendMessage(`❌ | The file size exceeds 25MB limit. Unable to send "${title}".`, event.threadID);
      return;
    }

    const filePath = path.resolve(__dirname, 'temp', `${Date.now()}-${title}.mp3`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, response.data);

    await api.sendMessage({
      body: `🎵 | Here is your music: "${title}"\n\nTitle: ${title}\nAuthor: ${author.name}\nDuration: ${duration.timestamp}\nYouTube Link: ${url}`,
      attachment: fs.createReadStream(filePath)
    }, event.threadID);

    fs.unlinkSync(filePath);

    api.unsendMessage(findingMessage.messageID);
  } catch (error) {
    console.error(error);
    await api.sendMessage(`❌ | Sorry, there was an error getting the music`, event.threadID);
  }
};
