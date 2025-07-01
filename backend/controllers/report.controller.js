const pool = require("../db");
const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");

exports.getDriveReports = async (req, res) => {
  try {
    const user = req.user;

    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);

    const drive = google.drive({ version: "v3", auth });

    const about = await drive.about.get({ fields: "storageQuota" });
    const totalUsage = parseInt(about.data.storageQuota.usage || "0");
    const totalQuota = parseInt(
      about.data.storageQuota.limit || 15 * 1024 * 1024 * 1024
    );

    const { rows: files } = await pool.query(
      "SELECT mime_type, size FROM drive_files WHERE user_id = $1",
      [user.id]
    );

    let typeStats = { videos: 0, images: 0, documents: 0, others: 0 };
    let sizeCategories = { small: 0, medium: 0, large: 0, huge: 0 };

    for (const file of files) {
      const size = parseInt(file.size || 0);
      const mime = file.mime_type;

      if (mime.startsWith("video")) typeStats.videos += size;
      else if (mime.startsWith("image")) typeStats.images += size;
      else if (mime.includes("pdf") || mime.includes("word") || mime.includes("text"))
        typeStats.documents += size;
      else typeStats.others += size;

      if (size < 5 * 1024 * 1024) sizeCategories.small++;
      else if (size < 50 * 1024 * 1024) sizeCategories.medium++;
      else if (size < 200 * 1024 * 1024) sizeCategories.large++;
      else sizeCategories.huge++;
    }

    const { rows: hashedDuplicates } = await pool.query(
      `SELECT size, COUNT(*) as count FROM drive_files
       WHERE user_id = $1 AND content_hash IS NOT NULL
       GROUP BY name, size, content_hash
       HAVING COUNT(*) > 1`,
      [user.id]
    );

    const { rows: fallbackDuplicates } = await pool.query(
      `SELECT size, COUNT(*) as count FROM drive_files
       WHERE user_id = $1 AND content_hash IS NULL
       GROUP BY name, size
       HAVING COUNT(*) > 1`,
      [user.id]
    );

    let totalDuplicateSize = 0;

    for (const row of hashedDuplicates) {
      const size = parseInt(row.size || 0);
      const count = parseInt(row.count || 0);
      totalDuplicateSize += size * (count - 1);
    }

    for (const row of fallbackDuplicates) {
      const size = parseInt(row.size || 0);
      const count = parseInt(row.count || 0);
      totalDuplicateSize += size * (count - 1);
    }

    const { rows: deleted } = await pool.query(
      `SELECT COALESCE(SUM(size), 0) AS deleted_size
       FROM drive_files
       WHERE file_id IN (
         SELECT item_id FROM cleanup_logs
         WHERE user_id = $1 AND source = 'google_drive' AND action = 'delete'
       )`,
      [user.id]
    );

    const deletedSize = parseInt(deleted[0]?.deleted_size || "0");

    await pool.query(
      `INSERT INTO reports (user_id, report_type, report)
       VALUES ($1, $2, $3)`,
      [user.id, 'pdf', null]
    );

    res.json({
      totalUsage,
      totalQuota,
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
