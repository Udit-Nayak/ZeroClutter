const express = require("express");
const router = express.Router();
const { fetchAllMails,fetchLargeAttachmentMails } = require("../controllers/gmail.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/fetch", protectRoute, fetchAllMails);
router.get("/large",protectRoute, fetchLargeAttachmentMails);

module.exports = router;
