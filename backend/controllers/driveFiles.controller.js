const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");
const pool = require("../db");

const rescanDriveFiles = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.google_tokens) {
      return res.status(400).json({ 
        success: false,
        error: "Google Drive not connected" 
      });
    }

    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    const files = [];
    let nextPageToken = null;

    do {
      const result = await drive.files.list({
        pageSize: 1000,
        fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, md5Checksum)",
        q: "trashed = false",
        pageToken: nextPageToken || undefined,
      });

      files.push(...result.data.files);
      nextPageToken = result.data.nextPageToken;
    } while (nextPageToken);

    const { rows: dbFiles } = await pool.query(
      "SELECT file_id FROM drive_files WHERE user_id = $1",
      [user.id]
    );
    const dbFileIds = new Set(dbFiles.map((f) => f.file_id));
    const driveFileIds = new Set(files.map((f) => f.id));

    const deletedIds = [...dbFileIds].filter((id) => !driveFileIds.has(id));
    if (deletedIds.length > 0) {
      await pool.query(
        `DELETE FROM drive_files WHERE user_id = $1 AND file_id = ANY($2::text[])`,
        [user.id, deletedIds]
      );
    }

    for (const file of files) {
      const existsInDb = dbFileIds.has(file.id);
      if (existsInDb) {
        await pool.query(
          `UPDATE drive_files 
           SET name = $1, size = $2, mime_type = $3, modified = $4, parent_id = $5, content_hash = $6
           WHERE user_id = $7 AND file_id = $8`,
          [
            file.name,
            Number(file.size) || 0,
            file.mimeType,
            file.modifiedTime,
            file.parents?.[0] || null,
            file.md5Checksum || null,
            user.id,
            file.id,
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO drive_files 
           (user_id, file_id, name, size, mime_type, modified, parent_id, content_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            user.id,
            file.id,
            file.name,
            Number(file.size) || 0,
            file.mimeType,
            file.modifiedTime,
            file.parents?.[0] || null,
            file.md5Checksum || null,
          ]
        );
      }
    }

    await pool.query(
      `INSERT INTO scan_history (user_id, scan_type, scanned_files, scan_report)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'rescan', files.length, null]
    );

    res.json({ 
      success: true,
      message: "Drive re-scanned and database updated.",
      scanned_files: files.length,
      deleted_files: deletedIds.length
    });
  } catch (err) {
    console.error("❌ Failed to rescan drive:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Rescan failed",
      message: err.message 
    });
  }
};

const scanDriveFiles = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.google_tokens) {
      return res.status(400).json({ 
        success: false,
        error: "Google Drive not connected" 
      });
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
          "nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, md5Checksum)",
        q: "trashed = false",
        pageToken: nextPageToken || undefined,
      });

      files.push(...result.data.files);
      nextPageToken = result.data.nextPageToken;
    } while (nextPageToken);

    await pool.query("DELETE FROM drive_files WHERE user_id = $1", [user.id]);

    for (const file of files) {
      try {
        await pool.query(
          `INSERT INTO drive_files 
            (user_id, file_id, name, size, mime_type, modified, parent_id, content_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            user.id,
            file.id,
            file.name,
            Number(file.size) || 0,
            file.mimeType,
            file.modifiedTime,
            file.parents?.[0] || null,
            file.md5Checksum || null,
          ]
        );
      } catch (err) {
        console.warn(`⚠️ DB Insert Error [${file.name}]: ${err.message}`);
      }
    }

    const tree = buildDriveTree(files);
    res.json({ 
      success: true,
      message: "Drive scanned and tree built", 
      tree,
      scanned_files: files.length
    });
  } catch (err) {
    console.error("❌ Error scanning Drive:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to scan Google Drive",
      message: err.message 
    });
  }
};

const listDriveFiles = async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      mimeType,
      modifiedAfter,
      modifiedBefore,
      sortBy = "modified",
      sortOrder = "desc",
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
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
      ? sortOrder.toUpperCase()
      : "DESC";

    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching filtered/sorted drive files:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch drive files",
      message: err.message 
    });
  }
};

const getDuplicateStats = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: "User not authenticated" 
      });
    }

    const duplicateQuery = `
      SELECT 
        content_hash,
        size,
        COUNT(*) as duplicate_count,
        (COUNT(*) - 1) as extra_files,
        ((COUNT(*) - 1) * size) as wasted_space
      FROM drive_files 
      WHERE user_id = $1 
        AND content_hash IS NOT NULL 
        AND content_hash != '' 
        AND size > 0
      GROUP BY content_hash, size
      HAVING COUNT(*) > 1
    `;

    const result = await pool.query(duplicateQuery, [user.id]);
    
    let totalDuplicates = 0;
    let totalWastedSpace = 0;

    result.rows.forEach(row => {
      totalDuplicates += parseInt(row.extra_files);
      totalWastedSpace += parseInt(row.wasted_space);
    });

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    res.json({
      success: true,
      duplicateCount: totalDuplicates,
      wastedSpace: totalWastedSpace,
      wastedSpaceFormatted: formatBytes(totalWastedSpace),
      duplicateGroups: result.rows.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error fetching duplicate stats:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch duplicate statistics",
      message: err.message 
    });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ 
      success: false,
      error: "Not authorized" 
    });

    const result = await pool.query(
      `SELECT action, type, saved_bytes, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [user.id]
    );

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const activities = result.rows.map((row) => ({
      action: row.action,
      type: row.type,
      size: formatBytes(row.saved_bytes),
      time: row.created_at,
    }));

    res.json({ 
      success: true,
      activities 
    });
  } catch (err) {
    console.error("❌ Error fetching activity logs:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch activity logs",
      message: err.message 
    });
  }
};

const emptyTrash = async (req, res) => {
  try {
    const user = req.user;
    if (!user.google_tokens) {
      return res.status(400).json({ 
        success: false,
        error: "Google Drive not connected" 
      });
    }

    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    await drive.files.emptyTrash();
    console.log(`🗑️ Trash emptied for user: ${user.email}`);
    try {
      await pool.query(
        `INSERT INTO activity_logs (user_id, action, type, saved_bytes, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [user.id, 'Emptied trash', 'trash_cleanup', 0]
      );
    } catch (logErr) {
      console.warn('Failed to log activity:', logErr.message);
    }

    res.status(200).json({ 
      success: true,
      message: "Trash emptied successfully." 
    });
  } catch (error) {
    console.error("❌ Failed to empty trash:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to empty Drive trash",
      message: error.message 
    });
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

module.exports = {
  scanDriveFiles,
  listDriveFiles,
  emptyTrash,
  rescanDriveFiles,
  getDuplicateStats, 
  getRecentActivities,
};