const pool = require("../db");
const crypto = require("crypto");


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



