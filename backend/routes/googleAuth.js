const express = require("express");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const { getOAuth2Client } = require("../libs/googleOAuth");
const pool = require("../db");

const router = express.Router();

router.get("/login", (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // <-- FORCE user to approve again
    scope: [
      "https://www.googleapis.com/auth/drive", // FULL access to delete files
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
  });

  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    console.log("🔐 Scopes granted by user:", tokens.scope);

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).send("User not found. Please sign up first.");
    }

    const user = result.rows[0];

    await pool.query("UPDATE users SET google_tokens = $1 WHERE id = $2", [
      tokens,
      user.id,
    ]);

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.redirect(`http://localhost:3000/dashboard?token=${accessToken}`);
  } catch (error) {
    console.error("❌ Google OAuth Callback Error:", error);
    res.status(500).send("Google authentication failed.");
  }
});

module.exports = router;
