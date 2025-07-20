const fs = require("fs");
const path = require("path"); 
const {
  generateHash,
} = require("../libs/fileScanner");

let cache = {
  files: [],
  folderPath: "",
};

const scanSelectedFolder = (req, res) => {
  try {
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    scannedFiles = uploadedFiles.map((file) => {
      const buffer = fs.readFileSync(file.path);
      return {
        name: file.originalname,
        fullPath: file.path,
        size: file.size,
        type: path.extname(file.originalname).slice(1),
        content_hash: generateHash(buffer),
      };
    });

    res.json({
      message: "Scan complete",
      files: scannedFiles,
    });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ error: err.message });
  }
};


const getDuplicates = (req, res) => {
  if (!cache.files.length) return res.status(400).json({ error: "No folder scanned yet" });
  const duplicates = findDuplicates(cache.files);
  res.json({ duplicates });
};

const getLargeFiles = (req, res) => {
  if (!cache.files.length) return res.status(400).json({ error: "No folder scanned yet" });
  const threshold = parseInt(req.query.threshold) || 100 * 1024 * 1024; // 100MB default
  const largeFiles = findLargeFiles(cache.files, threshold);
  res.json({ largeFiles });
};

const deleteFile = (req, res) => {
  const { fullPath } = req.body;
  if (!fullPath) return res.status(400).json({ error: "File path is required" });

  try {
    deleteFileByPath(fullPath);
    cache.files = cache.files.filter(f => f.fullPath !== fullPath);
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  scanSelectedFolder,
  getDuplicates,
  getLargeFiles,
  deleteFile,
};
