const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  profile,
  getStorageQuota
} = require("../controllers/user.controller");
const protectRoute = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", protectRoute, profile);
router.get("/storage-quota", protectRoute, getStorageQuota);

module.exports = router;
