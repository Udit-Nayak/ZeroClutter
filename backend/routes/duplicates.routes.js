const express = require("express");
const router = express.Router();
const {
  getDuplicateFiles,
  deleteDuplicates,
  deleteAllDuplicates
} = require("../controllers/duplicates.controller");
const protectRoute = require("../middleware/authMiddleware");

// Get all duplicate files
router.get("/", protectRoute, getDuplicateFiles);

// Delete specific duplicates (by content_hash or file_id)
router.post("/delete", protectRoute, deleteDuplicates);

// Delete all duplicates at once
router.post("/delete-all", protectRoute, deleteAllDuplicates);

module.exports = router;