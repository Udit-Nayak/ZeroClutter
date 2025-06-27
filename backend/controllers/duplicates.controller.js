const pool = require("../db");
const crypto = require("crypto");
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
    COUNT(*) AS duplicate_count
  FROM drive_files
  WHERE user_id = $1
  GROUP BY name, size
  HAVING COUNT(*) > 1;
`;

    const result = await pool.query(query, [user.id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching duplicate files:", err);
    res.status(500).json({ error: "Failed to fetch duplicate files" });
  }
};




exports.deleteDuplicates = async (req, res) => {
  try {
    const user = req.user;
    const { name, size } = req.body;

    if (!name || !size) {
      return res.status(400).json({ error: "Missing name or size" });
    }

    if (!user.google_tokens) {
      return res.status(400).json({ error: "Google Drive not connected" });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    const { rows } = await pool.query(
      `SELECT * FROM drive_files
       WHERE user_id = $1 AND name = $2 AND size = $3
       ORDER BY file_id`,
      [user.id, name, size]
    );

    if (rows.length <= 1) {
      return res.status(400).json({ error: "No duplicates found to delete" });
    }

    const batchId = uuidv4();
    const filesToDelete = rows.slice(1); // Keep one copy

    for (const file of filesToDelete) {
  try {
    const result = await drive.files.delete({ fileId: file.file_id });
    console.log(`✅ Deleted from Drive: ${file.file_id}`, result.status);
  } catch (error) {
    console.error(`❌ Failed to delete from Drive: ${file.file_id}`, error.message);
  }

  await pool.query(
  `INSERT INTO cleanup_logs (user_id, source, item_name, item_path, item_id, action, batch_id, timestamp)
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

}


    res.status(200).json({ message: "Duplicates deleted from Drive and DB", deleted: filesToDelete.length });
  } catch (err) {
    console.error("❌ Failed to delete duplicates:", err);
    res.status(500).json({ error: "Internal server error while deleting duplicates" });
  }
};


