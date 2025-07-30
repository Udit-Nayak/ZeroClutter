const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadDir}`);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitizedBaseName}_${uniqueSuffix}${ext}`;
      
      cb(null, filename);
    } catch (err) {
      cb(err, null);
    }
  },
});
const fileFilter = (req, file, cb) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const blockedExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    
    if (blockedExtensions.includes(ext)) {
      return cb(new Error(`File type ${ext} is not allowed for security reasons`), false);
    }
    const allowedMimeTypes = [
      'image/', 'video/', 'audio/', 'text/', 'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument',
      'application/zip', 'application/x-rar-compressed', 'application/json',
      'application/octet-stream' // Allow unknown binary files but log them
    ];
    
    const isAllowedMimeType = allowedMimeTypes.some(type => 
      file.mimetype.startsWith(type)
    );
    
    if (!isAllowedMimeType && ext !== '') {
      console.warn(`File ${file.originalname} has unrecognized MIME type: ${file.mimetype}`);
    }
    
    cb(null, true);
  } catch (err) {
    cb(err, false);
  }
};
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit per file (increased for large files)
    files: 2000, // Maximum 2000 files at once (increased)
    fieldSize: 50 * 1024 * 1024 // 50MB field size limit (increased for metadata)
  }
});
const generateFileContentHash = async (filePath) => {
  try {
    const fileStats = fs.statSync(filePath);
    if (fileStats.size > 100 * 1024 * 1024) { // 100MB
      const sampleSize = 64 * 1024; // 64KB sample
      const buffer = Buffer.alloc(sampleSize);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, sampleSize, 0);
      fs.closeSync(fd);
      
      const metadataHash = `${path.basename(filePath)}-${fileStats.size}-${fileStats.mtime.getTime()}`;
      const combinedData = Buffer.concat([Buffer.from(metadataHash), buffer]);
      return crypto.createHash('sha256').update(combinedData).digest('hex').substring(0, 20);
    } else {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex').substring(0, 20);
    }
  } catch (error) {
    console.error('Error generating file content hash:', error);
    const stats = fs.statSync(filePath);
    const fallbackData = `${path.basename(filePath)}-${stats.size}-${stats.mtime.getTime()}`;
    return crypto.createHash('md5').update(fallbackData).digest('hex').substring(0, 20);
  }
};
const convertUploadedFilesToLocalFormat = async (files, folderName = "Uploaded Files") => {
  const convertedFiles = [];
  
  for (const file of files) {
    try {
      const contentHash = await generateFileContentHash(file.path);
      const stats = fs.statSync(file.path);
      
      const convertedFile = {
        name: file.originalname,
        fullPath: file.path, // Server path for deletion
        size: file.size,
        type: file.mimetype || getFileExtension(file.originalname),
        lastModified: stats.mtime.getTime(),
        contentHash: contentHash,
        uploadedFile: true, // Flag to identify uploaded files
        serverPath: file.path // Keep server path for cleanup
      };
      
      convertedFiles.push(convertedFile);
    } catch (error) {
      console.error(`Error processing uploaded file ${file.originalname}:`, error);
    }
  }
  
  return convertedFiles;
};
const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return 'unknown';
  const ext = filename.split('.').pop();
  return ext === filename ? 'unknown' : ext.toLowerCase();
};
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error("Multer error:", error);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          error: 'File too large', 
          details: 'Maximum file size is 500MB',
          message: 'Please select smaller files'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          error: 'Too many files', 
          details: 'Maximum 2000 files allowed',
          message: 'Please select fewer files'
        });
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({ 
          error: 'Field value too large', 
          details: 'Field size limit exceeded',
          message: 'Request data is too large'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          error: 'Unexpected field', 
          details: 'Unexpected file field',
          message: 'Invalid file upload format'
        });
      default:
        return res.status(400).json({ 
          error: 'Upload error', 
          details: error.message,
          message: 'File upload failed'
        });
    }
  }
  
  if (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ 
      error: 'Server error during upload', 
      details: error.message,
      message: 'An error occurred while processing your files'
    });
  }
  
  next();
};
const cleanupUploadedFiles = (files) => {
  if (!files || !Array.isArray(files)) {
    console.warn("cleanupUploadedFiles: Invalid files parameter");
    return;
  }
  
  let cleanedCount = 0;
  files.forEach(file => {
    try {
      const filePath = file.path || file.destination + '/' + file.filename;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        cleanedCount++;
        console.log(`Cleaned up uploaded file: ${filePath}`);
      }
    } catch (err) {
      console.error(`Failed to cleanup file: ${file.path || file.filename}`, err);
    }
  });
  
  console.log(`Cleaned up ${cleanedCount} uploaded files`);
};
const cleanupOldFiles = (maxAge = 24 * 60 * 60 * 1000) => { // 24 hours default
  try {
    if (!fs.existsSync(uploadDir)) {
      console.log("Upload directory doesn't exist, skipping cleanup");
      return;
    }

    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    let cleanedCount = 0;
    
    files.forEach(filename => {
      try {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleanedCount++;
          console.log(`Cleaned up old file: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error cleaning up file ${filename}:`, err.message);
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`Cleanup completed: removed ${cleanedCount} old files`);
    }
  } catch (err) {
    console.error('Error during cleanup process:', err);
  }
};
const getUploadDirInfo = () => {
  try {
    if (!fs.existsSync(uploadDir)) {
      return { exists: false, files: 0, totalSize: 0 };
    }

    const files = fs.readdirSync(uploadDir);
    let totalSize = 0;

    files.forEach(filename => {
      try {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      } catch (err) {
        console.warn(`Could not get stats for file: ${filename}`, err.message);
      }
    });

    return {
      exists: true,
      files: files.length,
      totalSize: totalSize,
      directory: uploadDir
    };
  } catch (err) {
    console.error('Error getting upload directory info:', err);
    return { exists: false, files: 0, totalSize: 0, error: err.message };
  }
};
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const cleanupInterval = setInterval(() => {
  console.log("Running scheduled cleanup of old uploaded files...");
  cleanupOldFiles();
}, 2 * 60 * 60 * 1000);
process.on('SIGINT', () => {
  console.log('Clearing cleanup interval...');
  clearInterval(cleanupInterval);
});

process.on('SIGTERM', () => {
  console.log('Clearing cleanup interval...');
  clearInterval(cleanupInterval);
});

module.exports = {
  upload,
  handleUploadError,
  cleanupUploadedFiles,
  cleanupOldFiles,
  getUploadDirInfo,
  convertUploadedFilesToLocalFormat,
  generateFileContentHash,
  formatFileSize,
  uploadDir
};