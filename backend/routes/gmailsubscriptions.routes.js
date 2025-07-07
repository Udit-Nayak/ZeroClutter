const express = require("express");
const router = express.Router();
const { fetchAllMails,fetchLargeAttachmentMails ,fetchTrashEmails,deleteSelectedTrashMails, getSpamEmails, deleteSpamEmails, getDuplicateEmails,deleteDuplicateEmails} = require("../controllers/gmail.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/fetch", protectRoute, fetchAllMails);
router.get("/large",protectRoute, fetchLargeAttachmentMails);
router.get("/trash", protectRoute, fetchTrashEmails);
router.post("/trash/delete", protectRoute, deleteSelectedTrashMails);
router.get("/spam", protectRoute, getSpamEmails);
router.post("/spam/delete", protectRoute, deleteSpamEmails);

router.get("/duplicates", protectRoute, getDuplicateEmails);
router.post("/delete-duplicate", protectRoute, deleteDuplicateEmails);


module.exports = router;
