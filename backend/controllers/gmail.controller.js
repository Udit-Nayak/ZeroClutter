const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");

exports.fetchAllMails = async (req, res) => {
  try {
    const user = req.user;
    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    let allMessages = [];
    let nextPageToken = null;

    do {
      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 50,
        pageToken: nextPageToken || undefined,
      });

      const messageIds = response.data.messages || [];
      nextPageToken = response.data.nextPageToken;

      const detailedMessages = await Promise.all(
        messageIds.map(async (msg) => {
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });

          const headers = detail.data.payload?.headers || [];

          const getHeader = (name) =>
            headers.find((h) => h.name === name)?.value || "";

          return {
            id: detail.data.id,
            subject: getHeader("Subject") || "(No Subject)",
            from: getHeader("From"),
            date: getHeader("Date"),
            snippet: detail.data.snippet,
          };
        })
      );

      allMessages.push(...detailedMessages);
    } while (nextPageToken && allMessages.length < 100);

    console.log("Fetched messages:", allMessages.length);
    return res.json(allMessages);
  } catch (err) {
    console.error("Failed to fetch emails:", err.message);
    return res.status(500).json({ error: "Failed to fetch Gmail messages" });
  }
};
