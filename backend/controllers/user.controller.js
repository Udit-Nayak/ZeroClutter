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
    await pool.query(
  "UPDATE users SET last_opened_at = CURRENT_TIMESTAMP WHERE id = $1",
  [user.id]
);

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

exports.logout = (req, res) => {
  clearToken(res);
  res.status(200).json({ message: "Logged out successfully" });
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
