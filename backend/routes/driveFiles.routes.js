const express = require("express");
const router = express.Router();
const driveFilesController = require("../controllers/driveFiles.controller");
const protectRoute = require("../middleware/authMiddleware");

router.post("/scan", protectRoute, driveFilesController.scanDriveFiles);
router.post("/rescan", protectRoute, driveFilesController.rescanDriveFiles);
router.get("/list", protectRoute, driveFilesController.listDriveFiles);
router.post("/emptyTrash",protectRoute,driveFilesController.emptyTrash);
router.get("/duplicates/stats", protectRoute, driveFilesController.getDuplicateStats);


module.exports = router;