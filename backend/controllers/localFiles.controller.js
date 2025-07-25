const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// In-memory cache for scanned files
let cache = {
  files: [],
  folderName: "",
  lastScan: null,
};

// Generate hash for file content comparison
const generateHash = (fileData) => {
  try {
    if (!fileData) return null;
    return crypto.createHash("sha256").update(JSON.stringify(fileData)).digest("hex");
  } catch (error) {
    console.error("Error generating hash:", error);
    return null;
  }
};

// Generate simple hash for file identification (fallback)
const generateSimpleHash = (file) => {
  try {
    if (!file || !file.name) return null;
    const hashInput = `${file.name}-${file.size || 0}-${file.lastModified || Date.now()}`;
    return crypto.createHash("md5").update(hashInput).digest("hex").substring(0, 16);
  } catch (error) {
    console.error("Error generating simple hash:", error);
    return null;
  }
};

// Get file extension from filename
const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return 'unknown';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
};

// Find duplicate files based on content hash
const findDuplicates = (files) => {
  if (!Array.isArray(files)) return [];
  
  const hashMap = {};
  const duplicates = [];

  // Group files by content hash
  files.forEach(file => {
    if (!file || !file.contentHash) return;
    
    if (!hashMap[file.contentHash]) {
      hashMap[file.contentHash] = [];
    }
    hashMap[file.contentHash].push(file);
  });

  // Find groups with more than one file (duplicates)
  Object.values(hashMap).forEach(group => {
    if (group.length > 1) {
      duplicates.push(...group);
    }
  });

  return duplicates;
};

// Find largest files
const findLargeFiles = (files, limit = 10) => {
  if (!Array.isArray(files)) return [];
  
  return [...files]
    .filter(file => file && typeof file.size === 'number')
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, limit);
};

// Format file size for display
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file object
const validateFile = (file) => {
  if (!file || typeof file !== 'object') return false;
  if (!file.name || typeof file.name !== 'string') return false;
  if (typeof file.size !== 'number' || file.size < 0) return false;
  return true;
};

// Main scan function that processes file metadata from frontend
const scanSelectedFolder = (req, res) => {
  try {
    const { files, folderName } = req.body;

    // Validate input
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        error: "No files data provided",
        message: "Please select a folder and try again"
      });
    }

    console.log(`Processing ${files.length} files from folder: ${folderName || 'Unknown'}`);

    // Process and validate file data
    const processedFiles = files
      .filter(file => validateFile(file))
      .map(file => {
        // Ensure all required fields are present with fallbacks
        const processedFile = {
          name: file.name,
          fullPath: file.fullPath || file.name,
          size: parseInt(file.size) || 0,
          type: file.type || getFileExtension(file.name),
          lastModified: file.lastModified || Date.now(),
          contentHash: file.contentHash || generateSimpleHash(file)
        };

        return processedFile;
      })
      .filter(file => file.contentHash); // Only keep files with valid hashes

    if (processedFiles.length === 0) {
      return res.status(400).json({
        error: "No valid files to process",
        message: "No valid files were found in the selected folder"
      });
    }

    // Update cache
    cache.files = processedFiles;
    cache.folderName = folderName || 'Unknown Folder';
    cache.lastScan = new Date();

    // Find duplicates and large files
    const duplicates = findDuplicates(processedFiles);
    const largest = findLargeFiles(processedFiles, 10);

    const stats = {
      totalFiles: processedFiles.length,
      totalSize: processedFiles.reduce((sum, file) => sum + (file.size || 0), 0),
      duplicateCount: duplicates.length,
      folderName: cache.folderName,
      scanTime: cache.lastScan
    };

    console.log(`Scan complete - Total: ${stats.totalFiles}, Duplicates: ${stats.duplicateCount}, Largest: ${largest.length}`);

    res.json({
      success: true,
      message: "Scan complete",
      files: processedFiles,
      duplicates: duplicates,
      largest: largest,
      stats: stats
    });

  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ 
      error: "Failed to process files", 
      details: err.message,
      message: "An error occurred while processing the selected folder"
    });
  }
};

// Get duplicates from cache
const getDuplicates = (req, res) => {
  try {
    if (!cache.files.length) {
      return res.status(400).json({ 
        error: "No folder scanned yet",
        message: "Please scan a folder first"
      });
    }

    const duplicates = findDuplicates(cache.files);
    
    // Group duplicates by hash for better organization
    const duplicateGroups = {};
    duplicates.forEach(file => {
      if (!duplicateGroups[file.contentHash]) {
        duplicateGroups[file.contentHash] = [];
      }
      duplicateGroups[file.contentHash].push(file);
    });

    res.json({ 
      success: true,
      duplicates,
      duplicateGroups: Object.values(duplicateGroups),
      count: duplicates.length,
      groupCount: Object.keys(duplicateGroups).length,
      folderName: cache.folderName,
      message: duplicates.length > 0 ? `Found ${duplicates.length} duplicate files in ${Object.keys(duplicateGroups).length} groups` : "No duplicates found"
    });
  } catch (err) {
    console.error("Get duplicates error:", err);
    res.status(500).json({ 
      error: "Failed to get duplicates",
      details: err.message
    });
  }
};

// Get large files from cache
const getLargeFiles = (req, res) => {
  try {
    if (!cache.files.length) {
      return res.status(400).json({ 
        error: "No folder scanned yet",
        message: "Please scan a folder first"
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const minSize = parseInt(req.query.minSize) || 0;
    
    const largeFiles = cache.files
      .filter(file => (file.size || 0) >= minSize)
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, limit);

    res.json({ 
      success: true,
      largeFiles,
      count: largeFiles.length,
      folderName: cache.folderName,
      totalSize: largeFiles.reduce((sum, file) => sum + (file.size || 0), 0),
      message: largeFiles.length > 0 ? `Found ${largeFiles.length} large files` : "No large files found"
    });
  } catch (err) {
    console.error("Get large files error:", err);
    res.status(500).json({ 
      error: "Failed to get large files",
      details: err.message
    });
  }
};

// Delete file (Note: Limited by browser security for File System Access API)
const deleteFile = (req, res) => {
  try {
    const { fullPath } = req.body;
    
    if (!fullPath) {
      return res.status(400).json({ 
        error: "File path is required",
        message: "Please provide a valid file path"
      });
    }

    // Check if we're dealing with File System Access API files (browser-based)
    // or traditional file system files (server-based)
    const isTraditionalPath = path.isAbsolute(fullPath) && (fullPath.includes('\\') || fullPath.startsWith('/'));
    
    if (isTraditionalPath) {
      // Traditional server-side file deletion
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ 
          error: "File not found",
          message: "The specified file does not exist"
        });
      }

      try {
        // Create backup info before deletion
        const stats = fs.statSync(fullPath);
        const fileInfo = {
          path: fullPath,
          size: stats.size,
          deletedAt: new Date().toISOString()
        };

        // Delete the actual file
        fs.unlinkSync(fullPath);
        
        // Remove from cache
        const initialLength = cache.files.length;
        cache.files = cache.files.filter(f => f.fullPath !== fullPath);
        
        console.log(`Successfully deleted file: ${fullPath}`);
        
        res.json({ 
          success: true,
          message: "File deleted successfully",
          deletedFile: fileInfo,
          removed: true,
          remainingFiles: cache.files.length
        });
      } catch (deleteErr) {
        console.error("File deletion error:", deleteErr);
        res.status(500).json({
          error: "Failed to delete file",
          details: deleteErr.message,
          message: "Could not delete the file from disk"
        });
      }
    } else {
      // Browser-based File System Access API files
      // Due to browser security restrictions, we can only remove from cache
      const initialLength = cache.files.length;
      const fileToRemove = cache.files.find(f => f.fullPath === fullPath);
      cache.files = cache.files.filter(f => f.fullPath !== fullPath);
      
      if (cache.files.length < initialLength) {
        res.json({ 
          success: true,
          message: "File removed from scan results", 
          note: "Browser security prevents actual file deletion. The file has been removed from the scan results only.",
          removed: true,
          removedFile: fileToRemove,
          remainingFiles: cache.files.length
        });
      } else {
        res.status(404).json({ 
          error: "File not found in scan results",
          message: "The specified file was not found in the current scan"
        });
      }
    }

  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ 
      error: "Failed to process delete request", 
      details: err.message,
      message: "An error occurred while trying to delete the file"
    });
  }
};

// Get scan status and statistics
const getScanStatus = (req, res) => {
  try {
    const duplicateCount = cache.files.length > 0 ? findDuplicates(cache.files).length : 0;
    const totalSize = cache.files.reduce((sum, file) => sum + (file.size || 0), 0);

    res.json({
      success: true,
      hasData: cache.files.length > 0,
      fileCount: cache.files.length,
      folderName: cache.folderName,
      lastScan: cache.lastScan,
      totalSize: totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      duplicateCount: duplicateCount,
      largestFile: cache.files.length > 0 ? findLargeFiles(cache.files, 1)[0] : null,
      message: cache.files.length > 0 ? `Scanned ${cache.files.length} files` : "No scan data available"
    });
  } catch (err) {
    console.error("Get scan status error:", err);
    res.status(500).json({ 
      error: "Failed to get scan status",
      details: err.message
    });
  }
};

// Clear cache
const clearCache = (req, res) => {
  try {
    const previousCount = cache.files.length;
    const previousFolder = cache.folderName;
    
    cache = {
      files: [],
      folderName: "",
      lastScan: null,
    };

    console.log(`Cache cleared. Removed ${previousCount} files from memory.`);
    
    res.json({ 
      success: true,
      message: "Cache cleared successfully",
      clearedCount: previousCount,
      previousFolder: previousFolder
    });
  } catch (err) {
    console.error("Clear cache error:", err);
    res.status(500).json({ 
      error: "Failed to clear cache",
      details: err.message
    });
  }
};

// Get all files from cache with pagination
const getAllFiles = (req, res) => {
  try {
    if (!cache.files.length) {
      return res.status(200).json({ 
        success: true,
        files: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalFiles: 0,
          hasNext: false,
          hasPrev: false
        },
        folderName: cache.folderName,
        message: "No files in cache. Please scan a folder first."
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedFiles = cache.files.slice(startIndex, endIndex);
    const totalPages = Math.ceil(cache.files.length / limit);

    res.json({
      success: true,
      files: paginatedFiles,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalFiles: cache.files.length,
        hasNext: endIndex < cache.files.length,
        hasPrev: page > 1,
        limit: limit,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, cache.files.length)
      },
      folderName: cache.folderName,
      message: `Showing ${paginatedFiles.length} of ${cache.files.length} files`
    });
  } catch (err) {
    console.error("Get all files error:", err);
    res.status(500).json({ 
      error: "Failed to get files",
      details: err.message
    });
  }
};

module.exports = {
  scanSelectedFolder,
  getDuplicates,
  getLargeFiles,
  deleteFile,
  getScanStatus,
  clearCache,
  getAllFiles,
  // Export utility functions for testing
  findDuplicates,
  findLargeFiles,
  generateHash,
  generateSimpleHash,
  formatFileSize,
  getFileExtension
};