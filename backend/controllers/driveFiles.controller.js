const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");
const pool = require("../db");

const scanDriveFiles = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.google_tokens) {
      return res.status(400).json({ error: "Google Drive not connected" });
    }

    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    const files = [];
    let nextPageToken = null;

    do {
      const result = await drive.files.list({
        pageSize: 1000,
        fields:
          "nextPageToken, files(id, name, mimeType, size, modifiedTime, parents)",
        q: "trashed = false",
        pageToken: nextPageToken || undefined,
      });

      files.push(...result.data.files);
      nextPageToken = result.data.nextPageToken;
    } while (nextPageToken);

    await pool.query("DELETE FROM drive_files WHERE user_id = $1", [user.id]);

    for (const file of files) {
      await pool.query(
        `INSERT INTO drive_files 
      (user_id, file_id, name, size, mime_type, modified, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (file_id) DO NOTHING`,
        [
          user.id,
          file.id,
          file.name,
          file.size || 0,
          file.mimeType,
          file.modifiedTime,
          file.parents?.[0] || null,
        ]
      );
    }

    const tree = buildDriveTree(files);

    res.json({ message: "Drive scanned and tree built", tree });
  } catch (err) {
    console.error("Error scanning Drive:", err);
    res.status(500).json({ error: "Failed to scan Google Drive" });
  }
};

function buildDriveTree(files) {
  const map = {};
  const roots = [];

  for (const file of files) {
    map[file.id] = { ...file, children: [] };
  }

  for (const file of files) {
    const parentId = file.parents?.[0];
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[file.id]);
    } else {
      roots.push(map[file.id]);
    }
  }

  return roots;
}

const listDriveFiles = async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      mimeType,
      modifiedAfter,
      modifiedBefore,
      sortBy = "modified",
      sortOrder = "desc"
    } = req.query;

    const validSortFields = ["name", "size", "mime_type", "modified"];
    const validSortOrders = ["asc", "desc"];

    let query = `SELECT * FROM drive_files WHERE user_id = $1`;
    const params = [user.id];

    if (name) {
      params.push(`%${name}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    if (mimeType) {
      params.push(mimeType);
      query += ` AND mime_type = $${params.length}`;
    }

    if (modifiedAfter) {
      params.push(modifiedAfter);
      query += ` AND modified >= $${params.length}`;
    }

    if (modifiedBefore) {
      params.push(modifiedBefore);
      query += ` AND modified <= $${params.length}`;
    }

    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "modified";
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : "DESC";

    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching filtered/sorted drive files:", err);
    res.status(500).json({ error: "Failed to fetch drive files" });
  }
};

module.exports = {
  scanDriveFiles,
  listDriveFiles,
};
