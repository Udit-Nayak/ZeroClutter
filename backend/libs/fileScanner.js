const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let scannedFiles = [];
let selectedFolderPath = null;

function generateHash(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

function scanFolder(folderPath) {
  const allFiles = [];

  function scan(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        const buffer = fs.readFileSync(fullPath);
        const hash = generateHash(buffer);
        const ext = path.extname(entry.name).substring(1);

        allFiles.push({
          name: entry.name,
          fullPath,
          size: stats.size,
          type: ext || "unknown",
          content_hash: hash,
        });
      }
    }
  }

  scan(folderPath);
  return allFiles;
}

function scanSelectedFolder(req, res) {
  const { folderPath } = req.body;

  if (!folderPath || !fs.existsSync(folderPath)) {
    return res.status(400).json({ error: "Invalid folder path" });
  }

  selectedFolderPath = folderPath;
  scannedFiles = scanFolder(folderPath);

  res.json({ message: "Scan complete", count: scannedFiles.length });
}

function getDuplicates(req, res) {
  if (!scannedFiles.length) {
    return res.status(400).json({ error: "No files scanned yet" });
  }

  const hashMap = {};

  for (const file of scannedFiles) {
    if (!hashMap[file.content_hash]) {
      hashMap[file.content_hash] = [];
    }
    hashMap[file.content_hash].push(file);
  }

  const duplicates = Object.values(hashMap).filter(group => group.length > 1);

  res.json(duplicates.flat());
}

function getLargeFiles(req, res) {
  if (!scannedFiles.length) {
    return res.status(400).json({ error: "No files scanned yet" });
  }

  const top10 = [...scannedFiles].sort((a, b) => b.size - a.size).slice(0, 10);

  res.json(top10);
}

function deleteFile(req, res) {
  const { fullPath } = req.body;

  if (!fullPath || !fs.existsSync(fullPath)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  try {
    fs.unlinkSync(fullPath);
    scannedFiles = scannedFiles.filter(file => file.fullPath !== fullPath);
    res.json({ message: "File deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" });
  }
}

// 🔁 Export all functions
module.exports = {
  scanSelectedFolder,
  getDuplicates,
  getLargeFiles,
  deleteFile,
  scanFolder,
  generateHash,
};
