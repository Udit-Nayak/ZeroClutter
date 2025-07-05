const express = require("express");
const router = express.Router();
const { fetchAllMails } = require("../controllers/gmail.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/fetch", protectRoute, fetchAllMails);

module.exports = router;
