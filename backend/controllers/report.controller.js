// BACKEND: controllers/report.controller.js
const pool = require("../db");
const { google } = require("googleapis");

exports.getDriveReports = async (req, res) => {
  try {
    const user = req.user;
    const auth = new google.auth.OAuth2();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    const about = await drive.about.get({ fields: "storageQuota" });
    const totalUsage = parseInt(about.data.storageQuota.usage || "0");

    const { rows: files } = await pool.query(
      "SELECT mime_type, size FROM drive_files WHERE user_id = $1",
      [user.id]
    );

    let typeStats = { videos: 0, images: 0, documents: 0, others: 0 };
    let sizeCategories = { small: 0, medium: 0, large: 0, huge: 0 };
    let totalDuplicateSize = 0;

    for (const file of files) {
      const size = parseInt(file.size || 0);
      const type = file.mime_type;
      if (type.startsWith("video")) typeStats.videos += size;
      else if (type.startsWith("image")) typeStats.images += size;
      else if (type.includes("pdf") || type.includes("word"))
        typeStats.documents += size;
      else typeStats.others += size;

      if (size < 5 * 1024 * 1024) sizeCategories.small++;
      else if (size < 50 * 1024 * 1024) sizeCategories.medium++;
      else if (size < 200 * 1024 * 1024) sizeCategories.large++;
      else sizeCategories.huge++;
    }

    const { rows: logs } = await pool.query(
      `SELECT SUM(size) as deletedSize FROM drive_files
       WHERE file_id IN (
         SELECT item_id FROM cleanup_logs
         WHERE user_id = $1 AND source = 'google_drive' AND action = 'delete'
       )`,
      [user.id]
    );

    const deletedSize = parseInt(logs[0]?.deletedsize || 0);

    const { rows: dup } = await pool.query(
      `SELECT size, COUNT(*) FROM drive_files
       WHERE user_id = $1
       GROUP BY name, size
       HAVING COUNT(*) > 1`,
      [user.id]
    );
    for (const row of dup) {
      totalDuplicateSize += parseInt(row.size || 0) * (parseInt(row.count) - 1);
    }

    res.json({
      totalUsage,
      totalDuplicateSize,
      deletedSize,
      typeStats,
      sizeCategories,
    });
  } catch (err) {
    console.error("❌ Failed to generate reports:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};
