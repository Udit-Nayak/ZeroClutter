const pool = require("../db");
const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");
const { v4: uuidv4 } = require("uuid");

exports.getDuplicateFiles = async (req, res) => {
  try {
    const user = req.user;

    const query = `
      SELECT 
        MIN(file_id) AS file_id,
        name,
        size,
        content_hash,
        COUNT(*) AS duplicate_count,
        array_agg(file_id) AS file_ids
      FROM drive_files
      WHERE user_id = $1
      GROUP BY name, size, content_hash
      HAVING COUNT(*) > 1;
    `;

    const result = await pool.query(query, [user.id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching duplicate files:", err);
    res.status(500).json({ error: "Failed to fetch duplicate files" });
  }
};

exports.deleteDuplicates = async (req, res) => {
  try {
    const user = req.user;
    const { name, size, content_hash } = req.body;

    if (!name || !size) {
      return res.status(400).json({ error: "Missing name or size" });
    }

    if (!user.google_tokens) {
      return res.status(400).json({ error: "Google Drive not connected" });
    }

    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    const { rows } = await pool.query(
      `
        SELECT * FROM drive_files
        WHERE user_id = $1
          AND name = $2
          AND size = $3
          AND (
            (content_hash = $4) OR
            (content_hash IS NULL AND $4 IS NULL)
          )
        ORDER BY file_id;
      `,
      [user.id, name, size, content_hash || null]
    );

    if (rows.length <= 1) {
      return res.status(400).json({ error: "No duplicates found to delete" });
    }

    const batchId = uuidv4();
    const filesToDelete = rows.slice(1);
    let deletedCount = 0;

    for (const file of filesToDelete) {
      try {
        const metadata = await drive.files.get({
          fileId: file.file_id,
          fields: "owners",
        });

        const isOwner = metadata.data.owners?.some(
          (owner) => owner.emailAddress === user.email
        );

        if (!isOwner) {
          console.warn(`⚠️ Not owner of file: ${file.name} (${file.file_id})`);
          continue;
        }

        await drive.files.update({
          fileId: file.file_id,
          requestBody: { trashed: true },
        });

        console.log(`Moved to trash: ${file.file_id}`);
        deletedCount++;

        await pool.query(
          `INSERT INTO cleanup_logs 
            (user_id, source, item_name, item_path, item_id, action, batch_id, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            user.id,
            "google_drive",
            file.name,
            file.file_id,
            file.file_id,
            "delete",
            batchId,
          ]
        );
      } catch (err) {
        console.error(`Failed to delete ${file.file_id}: ${err.message}`);
      }
    }

    res.status(200).json({
      message: "Duplicate deletion completed",
      deleted: deletedCount,
    });
  } catch (err) {
    console.error("Internal error while deleting duplicates:", err);
    res.status(500).json({ error: "Failed to delete duplicates" });
  }
};
