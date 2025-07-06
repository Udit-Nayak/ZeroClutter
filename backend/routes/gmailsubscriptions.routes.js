const express = require("express");
const router = express.Router();
const { fetchAllMails,fetchLargeAttachmentMails ,fetchTrashEmails,deleteSelectedTrashMails} = require("../controllers/gmail.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/fetch", protectRoute, fetchAllMails);
router.get("/large",protectRoute, fetchLargeAttachmentMails);
router.get("/trash", protectRoute, fetchTrashEmails);
router.post("/trash/delete", protectRoute, deleteSelectedTrashMails);

module.exports = router;
