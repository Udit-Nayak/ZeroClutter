const express = require("express");
const router = express.Router();
const { listEmails } = require("../controllers/gmail.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/listMails", protectRoute, listEmails);

module.exports = router;
