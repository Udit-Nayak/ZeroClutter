const express = require("express");
const router = express.Router();
const { getDriveReports } = require("../controllers/report.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/", protectRoute,getDriveReports);



module.exports = router;
