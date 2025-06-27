const express = require("express");
const router = express.Router();
const driveFilesController = require("../controllers/driveFiles.controller");
const protectRoute = require("../middleware/authMiddleware");

router.post("/scan", protectRoute, driveFilesController.scanDriveFiles);
router.get("/list", protectRoute, driveFilesController.listDriveFiles);

module.exports = router;