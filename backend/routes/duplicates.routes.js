const express = require("express");
const router = express.Router();
const { getDuplicateFiles } = require("../controllers/duplicates.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/", protectRoute, getDuplicateFiles);

module.exports = router;
