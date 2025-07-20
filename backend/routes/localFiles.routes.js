const express = require("express");
const upload = require("../middleware/upload");
const {
  scanSelectedFolder,
  getDuplicates,
  getLargeFiles,
  deleteFile,
} = require("../controllers/localFiles.controller");

const router = express.Router();

router.post("/scan", upload.array("files"), scanSelectedFolder);
router.get("/duplicates", getDuplicates);
router.get("/large", getLargeFiles);
router.delete("/delete", deleteFile);

module.exports = router;
