const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");
function getDateFilterQuery(filter) {
  const now = new Date();
  const date = new Date(now);

  if (filter === "1m") date.setMonth(now.getMonth() - 1);
  else if (filter === "3m") date.setMonth(now.getMonth() - 3);
  else if (filter === "6m") date.setMonth(now.getMonth() - 6);
  else if (filter === "1y") date.setFullYear(now.getFullYear() - 1);
  else if (filter === "2y") date.setFullYear(now.getFullYear() - 2);
  else if (filter === "3y") date.setFullYear(now.getFullYear() - 3);
  else return "";

  const after = Math.floor(date.getTime() / 1000);
  return `after:${after}`;
}

exports.fetchAllMails = async (req, res) => {
  try {
    const user = req.user;
    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    const filter = req.query.filter || "all";
    const dateQuery = getDateFilterQuery(filter);

    let allMessages = [];
    let nextPageToken = null;

    do {
      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 50,
        pageToken: nextPageToken || undefined,
        q: dateQuery,
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

exports.fetchLargeAttachmentMails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    const filter = req.query.filter || "all";
    let query = "has:attachment";

    // Translate filter into Gmail query
    if (filter === ">20") {
      query += " larger:20971520"; // >20MB in bytes
    } else if (filter === "10-20") {
      query += " larger:10485760 smaller:20971520"; // 10MB to 20MB
    } else if (filter === "<10") {
      query += " smaller:10485760"; // <10MB
    } else {
      // default to >5MB for 'all'
      query += " larger:5242880";
    }

    const largeMails = [];
    let nextPageToken = null;

    do {
      const listRes = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        pageToken: nextPageToken || undefined,
        q: query,
      });

      const messageIds = listRes.data.messages || [];
      nextPageToken = listRes.data.nextPageToken;

      const detailedMessages = await Promise.all(
        messageIds.map(async (msg) => {
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });

          return {
            id: detail.data.id,
            snippet: detail.data.snippet,
            subject:
              detail.data.payload?.headers?.find((h) => h.name === "Subject")
                ?.value || "(No Subject)",
            from:
              detail.data.payload?.headers?.find((h) => h.name === "From")
                ?.value || "Unknown",
            date:
              detail.data.payload?.headers?.find((h) => h.name === "Date")
                ?.value || null,
          };
        })
      );

      largeMails.push(...detailedMessages);
    } while (nextPageToken && largeMails.length < 100); // Limit for performance

    res.json(largeMails);
  } catch (err) {
    console.error("Failed to fetch large attachment mails:", err.message);
    res.status(500).json({ error: "Failed to fetch large attachment mails" });
  }
};

exports.fetchTrashEmails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    const trashEmails = [];
    let nextPageToken = null;

    do {
      const response = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["TRASH"],
        maxResults: 100,
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

          return {
            id: detail.data.id,
            snippet: detail.data.snippet,
            subject:
              detail.data.payload?.headers?.find((h) => h.name === "Subject")
                ?.value || "(No Subject)",
            from:
              detail.data.payload?.headers?.find((h) => h.name === "From")
                ?.value || "Unknown",
            date:
              detail.data.payload?.headers?.find((h) => h.name === "Date")
                ?.value || null,
          };
        })
      );

      trashEmails.push(...detailedMessages);
    } while (nextPageToken && trashEmails.length < 100);

    res.json(trashEmails);
  } catch (err) {
    console.error("Failed to fetch trash emails:", err.message);
    res.status(500).json({ error: "Failed to fetch trash emails" });
  }
};

exports.deleteSelectedTrashMails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    const {ids} = req.body;

    for (const id of ids) {
      await gmail.users.messages.delete({
        userId: "me",
        id,
      });
    }


    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to delete selected trash mails:", err.message);
    res.status(500).json({ error: "Failed to delete selected trash emails" });
  }
};

exports.getSpamEmails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    const spamEmails = [];
    let nextPageToken = null;

    do {
      const response = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["SPAM"],
        maxResults: 100,
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

          return {
            id: detail.data.id,
            snippet: detail.data.snippet,
            subject:
              detail.data.payload?.headers?.find((h) => h.name === "Subject")
                ?.value || "(No Subject)",
            from:
              detail.data.payload?.headers?.find((h) => h.name === "From")
                ?.value || "Unknown",
            date:
              detail.data.payload?.headers?.find((h) => h.name === "Date")
                ?.value || null,
          };
        })
      );

      spamEmails.push(...detailedMessages);
    } while (nextPageToken && spamEmails.length < 100);

    res.json(spamEmails);
  } catch (err) {
    console.error("Failed to fetch spam emails:", err.message);
    res.status(500).json({ error: "Failed to fetch spam emails" });
  }
};


exports.deleteSpamEmails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No email IDs provided" });
    }

    await Promise.all(
      ids.map((id) =>
        gmail.users.messages.delete({
          userId: "me",
          id,
        })
      )
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to delete selected spam mails:", err.message);
    res.status(500).json({ error: "Failed to delete selected spam emails" });
  }
};
