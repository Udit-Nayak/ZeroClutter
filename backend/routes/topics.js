const express = require("express");
const router = express.Router();
const { topicClusteringHandler } = require("../controllers/gmail.controller");
const protectRoute = require("../middleware/authMiddleware");

router.get("/emails/for-topic-clustering", protectRoute, topicClusteringHandler);

module.exports = router;
