const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");

exports.fetchAllMails = async (req, res) => {
  try {
    const user = req.user;
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    let allMessages = [];
    let nextPageToken = null;

    do {
      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 500,
        pageToken: nextPageToken || undefined,
      });

      allMessages.push(...(response.data.messages || []));

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);
    res.json(allMessages);
  } catch (err) {
    console.error("Failed to fetch emails:", err.message);
    res.status(500).json({ error: "Failed to fetch Gmails messages" });
  }
};
