const pool = require("../db");
const { google } = require("googleapis");

exports.getDriveReports = async (req, res) => {
  try {
    const user = req.user;
    const auth = new google.auth.OAuth2();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    // 1. Get actual Drive usage using Google API
    const about = await drive.about.get({ fields: "storageQuota" });
    const totalUsage = parseInt(about.data.storageQuota.usage || "0");
    const totalQuota = parseInt(about.data.storageQuota.limit || 15 * 1024 * 1024 * 1024); // fallback to 15GB

    // 2. Get all scanned files from DB
    const { rows: files } = await pool.query(
      "SELECT mime_type, size FROM drive_files WHERE user_id = $1",
      [user.id]
    );

    let typeStats = { videos: 0, images: 0, documents: 0, others: 0 };
    let sizeCategories = { small: 0, medium: 0, large: 0, huge: 0 };

    for (const file of files) {
      const size = parseInt(file.size || 0);
      const mime = file.mime_type;

      // File type distribution
      if (mime.startsWith("video")) typeStats.videos += size;
      else if (mime.startsWith("image")) typeStats.images += size;
      else if (mime.includes("pdf") || mime.includes("word") || mime.includes("text"))
        typeStats.documents += size;
      else typeStats.others += size;

      // File size categorization
      if (size < 5 * 1024 * 1024) sizeCategories.small++;
      else if (size < 50 * 1024 * 1024) sizeCategories.medium++;
      else if (size < 200 * 1024 * 1024) sizeCategories.large++;
      else sizeCategories.huge++;
    }

    // 3. Calculate duplicate size
    const { rows: dup } = await pool.query(
      `SELECT size, COUNT(*) as count FROM drive_files
       WHERE user_id = $1
       GROUP BY name, size
       HAVING COUNT(*) > 1`,
      [user.id]
    );

    let totalDuplicateSize = 0;
    for (const row of dup) {
      const size = parseInt(row.size || 0);
      const count = parseInt(row.count || 0);
      totalDuplicateSize += size * (count - 1); // Keep one copy
    }

    // 4. Calculate deleted size from cleanup_logs
    const { rows: deleted } = await pool.query(
      `SELECT COALESCE(SUM(size), 0) AS deletedSize
       FROM drive_files
       WHERE file_id IN (
         SELECT item_id FROM cleanup_logs
         WHERE user_id = $1 AND source = 'google_drive' AND action = 'delete'
       )`,
      [user.id]
    );

    const deletedSize = parseInt(deleted[0]?.deletedsize || "0");

    // ✅ Return report data
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
