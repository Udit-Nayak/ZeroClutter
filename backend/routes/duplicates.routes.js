const express = require("express");
const router = express.Router();
const {
  getDuplicateFiles,
  deleteDuplicates
} = require("../controllers/duplicates.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/", protectRoute, getDuplicateFiles);
router.post("/delete", protectRoute, deleteDuplicates);

module.exports = router;
