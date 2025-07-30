const bcrypt = require("bcrypt");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { generateToken, clearToken } = require("../libs/utils.js");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3) RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );
    const user = result.rows[0];
    const token = generateToken(user.id, res);
    res
      .status(201)
      .json({ message: "User registered successfully", user, token });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "User registration failed" });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, res);
    const { password: _, ...userSafe } = user;
    res
      .status(200)
      .json({ message: "Login successful", user: userSafe, token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
};
exports.logout = async (req, res) => {
  try {
    console.log("🚪 Logout endpoint hit!");
    console.log("📋 Headers received:", req.headers);

    const authHeader = req.headers.authorization;
    let userId = null;

    console.log("🔍 Auth header:", authHeader);

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      console.log("🎫 Token extracted:", token.substring(0, 20) + "...");

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        console.log("✅ JWT decoded successfully, userId:", userId);
      } catch (jwtError) {
        console.log(
          "⚠️ JWT verification failed during logout:",
          jwtError.message
        );
      }
    } else {
      console.log("❌ No valid Authorization header found");
    }
    if (userId) {
      console.log("🔄 Attempting to update last_opened_at for user:", userId);

      const updateResult = await pool.query(
        "UPDATE users SET last_opened_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING last_opened_at",
        [userId]
      );

      console.log("✅ Updated last_opened_at for user:", userId);
      console.log(
        "📅 New last_opened_at:",
        updateResult.rows[0]?.last_opened_at
      );
    } else {
      console.log("⚠️ No userId found, skipping database update");
    }

    clearToken(res);

    res.status(200).json({
      message: "Logged out successfully",
      timestamp: new Date().toISOString(),
      userId: userId, // For debugging only - remove in production
    });
  } catch (err) {
    console.error("💥 Logout error:", err.message);
    console.error("📍 Error stack:", err.stack);
    clearToken(res);

    res.status(200).json({
      message: "Logged out successfully",
      warning: "Could not update last activity time",
      error: err.message, 
    });
  }
};
exports.profile = async (req, res) => {
  try {
    console.log("🔍 Profile endpoint hit!");
    console.log("📋 Headers:", req.headers);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid auth header found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🎫 Token extracted:", token.substring(0, 20) + "...");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT decoded successfully:", decoded);

    const result = await pool.query(
      "SELECT id, username, email, avatar, last_opened_at FROM users WHERE id = $1",
      [decoded.userId]
    );

    console.log("📊 Database query result:", result.rows.length, "rows found");

    if (result.rows.length === 0) {
      console.log("❌ User not found in database for ID:", decoded.userId);
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const driveFileCountResult = await pool.query(
      "SELECT COUNT(*) FROM drive_files WHERE user_id = $1",
      [user.id]
    );
    const driveFileCount = parseInt(driveFileCountResult.rows[0].count, 10);

    console.log("👤 User found:", {
      id: user.id,
      username: user.username,
      email: user.email,
      last_opened_at: user.last_opened_at,
    });

    const responseData = {
      name: user.username,
      email: user.email,
      picture: user.avatar,
      last_opened_at: user.last_opened_at,
      drive_file_count: driveFileCount,
    };

    console.log("📤 Sending response:", responseData);
    res.status(200).json(responseData);
  } catch (err) {
    console.error("💥 Profile retrieval error:", err.message);
    console.error("📍 Error stack:", err.stack);

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      console.log("🔐 JWT Error detected");
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
};
exports.getStorageQuota = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.google_tokens) {
      return res.status(401).json({ message: "Google tokens not found" });
    }

    const { google } = require('googleapis');
    const { getOAuth2Client } = require('../libs/googleOAuth');
    
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(user.google_tokens);

    const formatBytes = (bytes) => {
      if (!bytes || bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const about = await drive.about.get({
      fields: 'storageQuota,user'
    });

    const storageQuota = about.data.storageQuota;
    console.log('Raw storage quota data:', storageQuota);
    
    const totalUsage = parseInt(storageQuota.usage) || 0;
    const driveUsage = parseInt(storageQuota.usageInDrive) || 0;
    const trashUsage = parseInt(storageQuota.usageInDriveTrash) || 0;
    const limit = parseInt(storageQuota.limit) || 0;

    let gmailUsage = parseInt(storageQuota.usageInGmail) || 0;
    
    if (gmailUsage === 0) {
      try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const messagesRes = await gmail.users.messages.list({ 
          userId: 'me', 
          maxResults: 1 
        });
        
        if (messagesRes.data.resultSizeEstimate) {
          gmailUsage = messagesRes.data.resultSizeEstimate * 75 * 1024;
        }
      } catch (gmailError) {
        console.log('Could not fetch Gmail usage:', gmailError.message);
      }
    }

    const photosUsage = Math.max(0, totalUsage - driveUsage - gmailUsage - trashUsage);

    console.log('Calculated usage breakdown:', {
      total: totalUsage,
      drive: driveUsage,
      gmail: gmailUsage,
      photos: photosUsage,
      trash: trashUsage,
      limit: limit
    });

    const storageData = {
      total: {
        used: totalUsage,
        limit: limit,
        percentage: limit > 0 ? Math.round((totalUsage / limit) * 100) : 0,
        formattedUsed: formatBytes(totalUsage),
        formattedLimit: formatBytes(limit)
      },
      drive: {
        used: driveUsage,
        percentage: limit > 0 ? Math.round((driveUsage / limit) * 100) : 0,
        formattedUsed: formatBytes(driveUsage)
      },
      gmail: {
        used: gmailUsage,
        percentage: limit > 0 ? Math.round((gmailUsage / limit) * 100) : 0,
        formattedUsed: formatBytes(gmailUsage)
      },
      photos: {
        used: photosUsage,
        percentage: limit > 0 ? Math.round((photosUsage / limit) * 100) : 0,
        formattedUsed: formatBytes(photosUsage)
      },
      trash: {
        used: trashUsage,
        percentage: limit > 0 ? Math.round((trashUsage / limit) * 100) : 0,
        formattedUsed: formatBytes(trashUsage)
      }
    };

    console.log('Final storage data being sent:', storageData);
    res.json(storageData);
    
  } catch (error) {
    console.error("Storage quota error:", error);
    
    const fallbackData = {
      total: { used: 0, limit: 0, percentage: 0, formattedUsed: "0 B", formattedLimit: "0 B" },
      drive: { used: 0, percentage: 0, formattedUsed: "0 B" },
      gmail: { used: 0, percentage: 0, formattedUsed: "0 B" },
      photos: { used: 0, percentage: 0, formattedUsed: "0 B" },
      trash: { used: 0, percentage: 0, formattedUsed: "0 B" }
    };
    
    res.status(500).json({ 
      message: "Failed to fetch storage quota",
      error: error.message,
      data: fallbackData
    });
  }
};