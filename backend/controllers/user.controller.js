const bcrypt = require("bcrypt");
const pool = require("../db");
const { generateToken, clearToken } = require("../libs/utils.js");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
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
    res.status(201).json({ message: "User registered successfully", user, token });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "User registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
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
    res.status(200).json({ message: "Login successful", user: userSafe, token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logout = (req, res) => {
  clearToken(res);
  res.status(200).json({ message: "Logged out successfully" });
};
