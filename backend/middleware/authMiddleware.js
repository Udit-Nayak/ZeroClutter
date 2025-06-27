const jwt = require("jsonwebtoken");
const pool = require("../db");

const protectRoute = async (req, res, next) => {
try {
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith("Bearer ")) {
return res.status(401).json({ message: "Unauthorized: No token provided" });
}
const token = authHeader.split(" ")[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);

const result = await pool.query(
  "SELECT id, username, email, google_tokens FROM users WHERE id = $1",
  [decoded.userId]
);

if (result.rows.length === 0) {
  return res.status(401).json({ message: "Unauthorized: User not found" });
}

req.user = result.rows[0];
next();

} catch (error) {
console.error("Auth Middleware Error:", error.message);
if (
error.name === "JsonWebTokenError" ||
error.name === "TokenExpiredError"
) {
return res.status(403).json({ message: "Invalid or expired token" });
}return res.status(500).json({ message: "Internal server error" });
}
};

module.exports = protectRoute;

