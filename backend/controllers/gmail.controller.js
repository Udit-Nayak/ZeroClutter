const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");

exports.listEmails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    const result = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    res.json(result.data);
  } catch (err) {
    console.error("Gmail list error:", err.message);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
};

