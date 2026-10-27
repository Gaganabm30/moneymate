const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getChallenges,
  getActiveWidget,
  createChallenge,
  recordContribution,
  updateChallenge,
  pauseChallenge,
  resumeChallenge,
  deleteChallenge,
  getRecommendations,
} = require("../controllers/challengeController");

// All challenge routes require authentication
router.use(protect);

router.get("/", getChallenges);
router.get("/widget", getActiveWidget);
router.get("/recommendations", getRecommendations);
router.post("/", createChallenge);
router.post("/:id/contribute", recordContribution);
router.put("/:id", updateChallenge);
router.patch("/:id/pause", pauseChallenge);
router.patch("/:id/resume", resumeChallenge);
router.delete("/:id", deleteChallenge);

module.exports = router;
