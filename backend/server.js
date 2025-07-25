const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

require("./db");

const userRoutes = require("./routes/user.routes");
const driveFilesRoutes = require("./routes/driveFiles.routes");
const duplicateRoutes = require("./routes/duplicates.routes");
const googleAuthRoutes = require("./routes/googleAuth");
const reportRoutes = require("./routes/reports.routes");
const MailRoutes = require("./routes/gmailsubscriptions.routes");
const topicRoutes = require("./routes/topics");
const localFilesRoutes = require("./routes/localFiles.routes.js");

const { cleanupOldFiles, getUploadDirInfo } = require("./middleware/upload");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Enhanced JSON parsing with larger limits for file metadata
app.use(express.json({ 
  limit: '100mb',
  verify: (req, res, buf) => {
    // Add request size logging for monitoring
    if (buf.length > 50 * 1024 * 1024) { // 50MB
      console.warn(`Large request received: ${buf.length} bytes from ${req.ip}`);
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '100mb' 
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 100),
    contentLength: req.get('Content-Length') || 'N/A'
  });
  
  // Log response time on completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
});

// Route mounting with error handling
app.use("/auth/google", googleAuthRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/driveFiles", driveFilesRoutes);
app.use("/api/duplicates", duplicateRoutes); 
app.use("/api/reports", reportRoutes); 
app.use("/api/gmail", MailRoutes); 
app.use("/api/topics", topicRoutes);
app.use("/api/localFiles", localFilesRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// Upload directory status endpoint
app.get("/api/upload-status", (req, res) => {
  try {
    const uploadInfo = getUploadDirInfo();
    res.json({
      success: true,
      uploadDirectory: uploadInfo,
      message: uploadInfo.exists ? 
        `Upload directory contains ${uploadInfo.files} files (${formatFileSize(uploadInfo.totalSize)})` :
        "Upload directory not found"
    });
  } catch (error) {
    console.error("Error getting upload status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get upload status",
      details: error.message
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Storage Cleaner API is running",
    version: "2.0.0",
    endpoints: {
      auth: "/auth/google",
      userAuth: "/api/auth",
      driveFiles: "/api/driveFiles",
      duplicates: "/api/duplicates",
      reports: "/api/reports",
      gmail: "/api/gmail",
      topics: "/api/topics",
      localFiles: "/api/localFiles",
      health: "/health",
      uploadStatus: "/api/upload-status"
    },
    documentation: "Visit /health for system status"
  });
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      "/auth/google",
      "/api/auth",
      "/api/driveFiles", 
      "/api/duplicates",
      "/api/reports",
      "/api/gmail",
      "/api/topics",
      "/api/localFiles",
      "/health"
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: "Internal server error",
    message: isDevelopment ? error.message : "An unexpected error occurred",
    stack: isDevelopment ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Utility function for file size formatting
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Cleanup job scheduling
const scheduleCleanupJobs = () => {
  // Clean up old uploaded files every 4 hours
  setInterval(() => {
    console.log("Running scheduled cleanup of uploaded files...");
    try {
      cleanupOldFiles(24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.error("Scheduled cleanup failed:", error);
    }
  }, 4 * 60 * 60 * 1000);

  // Log memory usage every hour
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log("Memory usage:", {
      rss: formatFileSize(memUsage.rss),
      heapTotal: formatFileSize(memUsage.heapTotal),
      heapUsed: formatFileSize(memUsage.heapUsed),
      external: formatFileSize(memUsage.external)
    });
  }, 60 * 60 * 1000);
};

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Storage Cleaner API Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗂️  Upload directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔍 Local Files API: http://localhost:${PORT}/api/localFiles`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  
  // Schedule cleanup jobs after server starts
  scheduleCleanupJobs();
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    
    // Perform final cleanup
    try {
      console.log('🧹 Running final cleanup...');
      cleanupOldFiles(0); // Clean all files on shutdown
      console.log('✅ Final cleanup completed');
    } catch (error) {
      console.error('❌ Final cleanup failed:', error);
    }
    
    process.exit(0);
  });
  
  // Force close server after 10 seconds
  setTimeout(() => {
    console.error('❌ Forcing server shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;