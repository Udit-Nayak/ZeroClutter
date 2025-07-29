const pool = require("../db");
const { google } = require("googleapis");
const { getOAuth2Client } = require("../libs/googleOAuth");
const { v4: uuidv4 } = require("uuid");

exports.getDuplicateFiles = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "User not authenticated" 
      });
    }

    console.log(`Fetching duplicates for user: ${user.id}`);

    // Fixed query: Group by content_hash only for true duplicates
    const query = `
      SELECT 
        content_hash,
        size,
        COUNT(*) as duplicate_count,
        array_agg(
          json_build_object(
            'file_id', file_id,
            'name', name,
            'size', size,
            'modified', modified,
            'mime_type', mime_type,
            'parent_id', parent_id
          ) ORDER BY modified DESC
        ) as files
      FROM drive_files
      WHERE user_id = $1 
        AND content_hash IS NOT NULL 
        AND content_hash != ''
        AND size > 0
      GROUP BY content_hash, size
      HAVING COUNT(*) > 1
      ORDER BY (COUNT(*) * size) DESC;
    `;

    const result = await pool.query(query, [user.id]);
    
    console.log(`Found ${result.rows.length} duplicate groups`);
    
    // Format for frontend compatibility - flatten to individual file records but group duplicates
    const duplicateFiles = [];
    
    result.rows.forEach(group => {
      const files = group.files;
      // Skip the first file (keep it), mark others as duplicates
      for (let i = 1; i < files.length; i++) {
        duplicateFiles.push({
          ...files[i],
          content_hash: group.content_hash,
          duplicate_count: parseInt(group.duplicate_count),
          is_duplicate: true,
          original_file: files[0], // Reference to the file we'll keep
          group_size: files.length,
          wasted_space: parseInt(files[i].size)
        });
      }
    });

    const totalWastedSpace = duplicateFiles.reduce((sum, file) => sum + (file.wasted_space || 0), 0);

    console.log(`Returning ${duplicateFiles.length} duplicate files in ${result.rows.length} groups, wasting ${totalWastedSpace} bytes`);

    res.status(200).json({
      success: true,
      data: duplicateFiles,
      total_groups: result.rows.length,
      total_duplicates: duplicateFiles.length,
      total_wasted_space: totalWastedSpace
    });

  } catch (err) {
    console.error("❌ Error fetching duplicate files:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch duplicate files",
      message: err.message 
    });
  }
};

exports.deleteDuplicates = async (req, res) => {
  try {
    const user = req.user;
    const { content_hash, file_id } = req.body;

    // Allow deletion by either content_hash (delete all duplicates) or specific file_id
    if (!content_hash && !file_id) {
      return res.status(400).json({ 
        success: false,
        error: "Missing content_hash or file_id" 
      });
    }

    if (!user.google_tokens) {
      return res.status(400).json({ 
        success: false,
        error: "Google Drive not connected" 
      });
    }

    const auth = getOAuth2Client();
    auth.setCredentials(user.google_tokens);
    const drive = google.drive({ version: "v3", auth });

    let queryText, queryParams;
    
    if (file_id) {
      // Delete specific file
      queryText = `SELECT * FROM drive_files WHERE user_id = $1 AND file_id = $2`;
      queryParams = [user.id, file_id];
    } else {
      // Delete all duplicates of a content hash (keep the most recent)
      queryText = `
        SELECT * FROM drive_files
        WHERE user_id = $1 AND content_hash = $2
        ORDER BY modified DESC
      `;
      queryParams = [user.id, content_hash];
    }

    const { rows } = await pool.query(queryText, queryParams);

    if (rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "No files found to delete" 
      });
    }

    const batchId = uuidv4();
    let deletedCount = 0;
    let totalSavedSpace = 0;

    // If deleting by content_hash, keep the most recent file (first in ordered result)
    const filesToDelete = file_id ? rows : rows.slice(1);

    for (const file of filesToDelete) {
      try {
        // Check if user owns the file
        const metadata = await drive.files.get({
          fileId: file.file_id,
          fields: "owners,trashed",
        });

        // Skip if already trashed
        if (metadata.data.trashed) {
          console.log(`File already trashed: ${file.file_id}`);
          continue;
        }

        const isOwner = metadata.data.owners?.some(
          (owner) => owner.emailAddress === user.email
        );

        if (!isOwner) {
          console.warn(`⚠️ Not owner of file: ${file.name} (${file.file_id})`);
          continue;
        }

        // Move to trash in Google Drive
        await drive.files.update({
          fileId: file.file_id,
          requestBody: { trashed: true },
        });

        // Remove from our database
        await pool.query(
          `DELETE FROM drive_files WHERE user_id = $1 AND file_id = $2`,
          [user.id, file.file_id]
        );

        console.log(`✅ Deleted duplicate: ${file.name} (${file.file_id})`);
        deletedCount++;
        totalSavedSpace += parseInt(file.size) || 0;

        // Log the cleanup action
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
            "delete_duplicate",
            batchId,
          ]
        );

      } catch (err) {
        console.error(`❌ Failed to delete ${file.file_id}: ${err.message}`);
      }
    }

    // Log activity if any files were deleted
    if (deletedCount > 0) {
      try {
        await pool.query(
          `INSERT INTO activity_logs (user_id, action, type, saved_bytes, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [user.id, 'Deleted duplicates', 'duplicate_cleanup', totalSavedSpace]
        );
      } catch (logErr) {
        console.warn('Failed to log activity:', logErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Duplicate deletion completed",
      deleted_count: deletedCount,
      saved_space: totalSavedSpace,
      batch_id: batchId
    });

  } catch (err) {
    console.error("❌ Internal error while deleting duplicates:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete duplicates",
      message: err.message 
    });
  }
};

// New endpoint to delete all duplicates at once
exports.deleteAllDuplicates = async (req, res) => {
  try {
    const user = req.user;

    if (!user.google_tokens) {
      return res.status(400).json({ 
        success: false,
        error: "Google Drive not connected" 
      });
    }

    // Get all content hashes that have duplicates
    const duplicateHashesQuery = `
      SELECT content_hash
      FROM drive_files 
      WHERE user_id = $1 
        AND content_hash IS NOT NULL 
        AND content_hash != ''
        AND size > 0
      GROUP BY content_hash
      HAVING COUNT(*) > 1
    `;

    const { rows: hashes } = await pool.query(duplicateHashesQuery, [user.id]);

    let totalDeleted = 0;
    let totalSaved = 0;

    // Delete duplicates for each hash
    for (const { content_hash } of hashes) {
      try {
        // Use the existing deleteDuplicates function
        const mockReq = { user, body: { content_hash } };
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              if (data.success) {
                totalDeleted += data.deleted_count;
                totalSaved += data.saved_space;
              }
            }
          })
        };

        await exports.deleteDuplicates(mockReq, mockRes);
      } catch (err) {
        console.error(`Error deleting duplicates for hash ${content_hash}:`, err);
      }
    }

    res.status(200).json({
      success: true,
      message: "All duplicates deleted",
      deleted_count: totalDeleted,
      saved_space: totalSaved
    });

  } catch (err) {
    console.error("❌ Error deleting all duplicates:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete all duplicates",
      message: err.message 
    });
  }
};