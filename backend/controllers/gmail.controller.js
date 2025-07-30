const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");
const axios = require("axios");

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

const extractDetails = (message) => {
  const headers = message.payload?.headers || [];
  const getHeader = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
    "";

  return {
    id: message.id,
    from: getHeader("From"),
    subject: getHeader("Subject"),
    snippet: message.snippet,
    internalDate: parseInt(message.internalDate),
  };
};

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
    if (filter === ">20") {
      query += " larger:20971520"; // >20MB in bytes
    } else if (filter === "10-20") {
      query += " larger:10485760 smaller:20971520"; // 10MB to 20MB
    } else if (filter === "<10") {
      query += " smaller:10485760"; // <10MB
    } else {
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

    const { ids } = req.body;

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

exports.getDuplicateEmails = async (req, res) => {
  try {
    const auth = getOAuth2Client(); // Reuse your configured OAuth2 client
    auth.setCredentials(req.user.google_tokens); // Use user's stored tokens

    const gmail = google.gmail({ version: "v1", auth });

    let nextPageToken = null;
    const allMessages = [];
    do {
      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        pageToken: nextPageToken,
      });

      const messages = response.data.messages || [];
      allMessages.push(...messages);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken && allMessages.length < 500);

    if (allMessages.length === 0) {
      return res.json([]); // No messages found
    }
    const detailedMessages = await Promise.all(
      allMessages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });
        return extractDetails(detail.data);
      })
    );
    const groups = {};
    for (const msg of detailedMessages) {
      const key = `${msg.from}||${msg.subject}||${msg.snippet}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    }
    const duplicates = Object.values(groups)
      .filter((group) => group.length > 1)
      .map((group) => {
        const sorted = group.sort((a, b) => b.internalDate - a.internalDate);
        return {
          from: sorted[0].from,
          subject: sorted[0].subject,
          snippet: sorted[0].snippet,
          count: sorted.length,
          latestId: sorted[0].id,
          duplicateIds: sorted.slice(1).map((m) => m.id), // keep only the latest
        };
      });

    res.json(duplicates);
  } catch (err) {
    console.error("Error fetching duplicates:", err.message);
    res.status(500).json({ error: "Failed to detect duplicates" });
  }
};

exports.deleteDuplicateEmails = async (req, res) => {
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
    console.error("Failed to bulk delete emails:", err.message);
    res.status(500).json({ error: "Failed to delete emails" });
  }
};

exports.getPromotionsEmails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);

    const gmail = google.gmail({ version: "v1", auth });

    const promoList = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["CATEGORY_PROMOTIONS"],
      maxResults: 100,
    });

    const messages = promoList.data.messages || [];
    const fullMails = await Promise.all(
      messages.map((msg) =>
        gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" })
      )
    );

    const mails = fullMails.map((detail) => {
      const headers = detail.data.payload.headers;
      const getHeader = (name) =>
        headers.find((h) => h.name === name)?.value || "";

      return {
        id: detail.data.id,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        snippet: detail.data.snippet,
        date: parseInt(detail.data.internalDate),
      };
    });

    res.json(mails);
  } catch (err) {
    console.error("Failed to fetch promotions:", err.message);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};

exports.deletePromotionsEmails = async (req, res) => {
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
    console.error("Failed to delete promotional emails:", err.message);
    res.status(500).json({ error: "Failed to delete promotional emails" });
  }
};

exports.topicClusteringHandler = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });

    let validEmails = [];
    let nextPageToken = null;
    let totalFetched = 0;
    const MAX_TOTAL = 500;

    while (validEmails.length < 25 && totalFetched < MAX_TOTAL) {
      const listRes = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        pageToken: nextPageToken || undefined,
      });

      const messages = listRes.data.messages || [];
      nextPageToken = listRes.data.nextPageToken;
      totalFetched += messages.length;

      const batchEmails = await Promise.all(
        messages.map(async (msg) => {
          try {
            const msgData = await gmail.users.messages.get({
              userId: "me",
              id: msg.id,
              format: "full",
            });

            const headers = msgData.data.payload?.headers || [];
            const subject =
              headers.find((h) => h.name === "Subject")?.value?.trim() || "";
            const snippet = msgData.data.snippet?.trim() || "";

            const from =
              headers.find((h) => h.name === "From")?.value?.trim() ||
              "Unknown";
            const date = parseInt(msgData.data.internalDate);

            if (subject && snippet) {
              return {
                id: msg.id,
                subject,
                snippet,
                from,
                date,
              };
            }
          } catch (err) {
            console.warn(`⚠️ Failed to fetch message ${msg.id}:`, err.message);
          }
          return null;
        })
      );

      validEmails.push(...batchEmails.filter(Boolean));

      if (!nextPageToken) break;
    }

    if (validEmails.length < 2) {
      console.warn(
        `❌ Only ${validEmails.length} valid emails found out of ${totalFetched} scanned`
      );
      return res
        .status(400)
        .json({ error: "Not enough valid emails to cluster." });
    }

    console.log(
      `✅ Sending ${validEmails.length} valid emails to cluster (out of ${totalFetched})`
    );

    const clusterRes = await axios.post(
      "http://localhost:5001/cluster-topics",
      validEmails
    );

    if (!Array.isArray(clusterRes.data)) {
      console.error("❌ Cluster response is not an array:", clusterRes.data);
      return res
        .status(500)
        .send("Invalid clustering response from microservice.");
    }

    res.json(clusterRes.data);
  } catch (err) {
    console.error("🔥 Error in topic clustering:", err.message);
    res.status(500).send("Failed to cluster emails");
  }
};

exports.getOldUnreadEmails = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    auth.setCredentials(req.user.google_tokens);
    const gmail = google.gmail({ version: "v1", auth });
    const now = new Date();
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
    const after = Math.floor(sixMonthsAgo.getTime() / 1000);
    const query = `is:unread before:${after}`;

    let oldUnreadEmails = [];
    let nextPageToken = null;

    do {
      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 50,
        pageToken: nextPageToken || undefined,
        q: query,
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
            subject:
              detail.data.payload?.headers?.find((h) => h.name === "Subject")
                ?.value || "(No Subject)",
            from:
              detail.data.payload?.headers?.find((h) => h.name === "From")
                ?.value || "Unknown",
            date:
              detail.data.payload?.headers?.find((h) => h.name === "Date")
                ?.value || null,
            snippet: detail.data.snippet,
          };
        })
      );

      oldUnreadEmails.push(...detailedMessages);
    } while (nextPageToken && oldUnreadEmails.length < 100);

    res.json(oldUnreadEmails);
  } catch (err) {
    console.error("Failed to fetch old unread emails:", err.message);
    res.status(500).json({ error: "Failed to fetch old unread emails" });
  }
};

exports.deleteOldUnreadEmails = async (req, res) => {
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
    console.error("Failed to delete old unread emails:", err.message);
    res.status(500).json({ error: "Failed to delete old unread emails" });
  }
};