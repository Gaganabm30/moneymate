const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { getInsights, chat } = require("../controllers/aiController");

// GET /api/ai/insights — Full deterministic + AI insights
router.get("/insights", protect, getInsights);

// POST /api/ai/chat — AI chat response
router.post("/chat", protect, chat);

module.exports = router;
