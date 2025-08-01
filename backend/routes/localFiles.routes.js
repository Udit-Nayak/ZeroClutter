const express = require("express");
const { upload, handleUploadError } = require("../middleware/upload");
const {
  scanSelectedFolder,
  getDuplicates,
  getLargeFiles,
  deleteFile,
  getScanStatus,
  clearCache,
  getAllFiles,
} = require("../controllers/localFiles.controller");

const router = express.Router();
router.use(express.json({ limit: '100mb' }));
router.use(express.urlencoded({ extended: true, limit: '100mb' }));
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    body: req.method === 'POST' ? `${Object.keys(req.body).length} keys` : 'N/A',
    query: Object.keys(req.query).length > 0 ? req.query : 'N/A'
  });
  next();
});
router.post("/scan", (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "No request body provided",
        message: "Please provide file data in the request body"
      });
    }

    scanSelectedFolder(req, res);
  } catch (error) {
    console.error("Scan route error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while processing the scan request",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
router.post("/upload-scan", upload.array("files", 1000), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: "No files uploaded",
        message: "Please select files to upload and scan"
      });
    }

    console.log(`Processing ${req.files.length} uploaded files`);
    const files = req.files.map(file => {
      const crypto = require('crypto');
      return {
        name: file.originalname,
        fullPath: file.path,
        size: file.size,
        type: file.mimetype || file.originalname.split('.').pop().toLowerCase(),
        lastModified: Date.now(),
        contentHash: crypto.createHash('md5')
          .update(`${file.originalname}-${file.size}-${Date.now()}`)
          .digest('hex')
          .substring(0, 16)
      };
    });
    req.body = { files, folderName: "Uploaded Files" };
    scanSelectedFolder(req, res);
  } catch (err) {
    console.error("Upload scan error:", err);
    res.status(500).json({
      error: "Failed to process uploaded files",
      details: err.message,
      message: "An error occurred while processing uploaded files"
    });
  }
});
router.get("/files", (req, res) => {
  try {
    getAllFiles(req, res);
  } catch (error) {
    console.error("Get files route error:", error);
    res.status(500).json({
      error: "Failed to retrieve files",
      message: "An error occurred while retrieving files"
    });
  }
});
router.get("/duplicates", (req, res) => {
  try {
    getDuplicates(req, res);
  } catch (error) {
    console.error("Get duplicates route error:", error);
    res.status(500).json({
      error: "Failed to retrieve duplicates",
      message: "An error occurred while retrieving duplicate files"
    });
  }
});
router.get("/large", (req, res) => {
  try {
    getLargeFiles(req, res);
  } catch (error) {
    console.error("Get large files route error:", error);
    res.status(500).json({
      error: "Failed to retrieve large files",
      message: "An error occurred while retrieving large files"
    });
  }
});
router.get("/status", (req, res) => {
  try {
    getScanStatus(req, res);
  } catch (error) {
    console.error("Get status route error:", error);
    res.status(500).json({
      error: "Failed to retrieve scan status",
      message: "An error occurred while retrieving scan status"
    });
  }
});
router.delete("/delete", (req, res) => {
  try {
    if (!req.body || !req.body.fullPath) {
      return res.status(400).json({
        error: "File path is required",
        message: "Please provide a valid file path in the request body"
      });
    }
    deleteFile(req, res);
  } catch (error) {
    console.error("Delete file route error:", error);
    res.status(500).json({
      error: "Failed to delete file",
      message: "An error occurred while deleting the file"
    });
  }
});
router.delete("/clear", (req, res) => {
  try {
    clearCache(req, res);
  } catch (error) {
    console.error("Clear cache route error:", error);
    res.status(500).json({
      error: "Failed to clear cache",
      message: "An error occurred while clearing the cache"
    });
  }
});
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Local files service is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});
router.use((error, req, res, next) => {
  console.error("Local files route error:", error);
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: "Request too large",
      message: "The request data is too large. Please try with fewer files.",
      maxSize: "100MB"
    });
  }

  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    return res.status(400).json({
      error: "Invalid JSON",
      message: "The request contains invalid JSON data",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  const statusCode = error.statusCode || error.status || 500;
  res.status(statusCode).json({
    error: error.name || "Internal server error",
    message: error.message || "An unexpected error occurred",
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;