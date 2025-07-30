const express = require("express");
const router = express.Router();
const {
  getDuplicateFiles,
  deleteDuplicates,
  deleteAllDuplicates
} = require("../controllers/duplicates.controller");
const protectRoute = require("../middleware/authMiddleware");
router.get("/", protectRoute, getDuplicateFiles);
router.post("/delete", protectRoute, deleteDuplicates);
router.post("/delete-all", protectRoute, deleteAllDuplicates);

module.exports = router;