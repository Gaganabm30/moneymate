const challengeService = require("../services/challengeService");

/**
 * GET /api/challenges
 * Retrieve all challenges, summary, achievements, and recommendations.
 */
async function getChallenges(req, res) {
  try {
    const data = await challengeService.getUserChallenges(req.user._id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch challenges",
    });
  }
}

/**
 * GET /api/challenges/widget
 * Retrieve primary active challenge for dashboard widget.
 */
async function getActiveWidget(req, res) {
  try {
    const data = await challengeService.getActiveWidget(req.user._id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching widget data:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch challenge widget",
    });
  }
}

/**
 * POST /api/challenges
 * Create a new challenge.
 */
async function createChallenge(req, res) {
  try {
    const challenge = await challengeService.createChallenge(
      req.user._id,
      req.body
    );
    return res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      data: challenge,
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create challenge",
    });
  }
}

/**
 * POST /api/challenges/:id/contribute
 * Record a contribution to a challenge.
 */
async function recordContribution(req, res) {
  try {
    const result = await challengeService.recordContribution(
      req.user._id,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: result.isDuplicate
        ? "Contribution already recorded"
        : "Contribution recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error recording contribution:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to record contribution",
    });
  }
}

/**
 * PUT /api/challenges/:id
 * Update challenge details.
 */
async function updateChallenge(req, res) {
  try {
    const updated = await challengeService.updateChallenge(
      req.user._id,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Challenge updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update challenge",
    });
  }
}

/**
 * PATCH /api/challenges/:id/pause
 * Pause a challenge.
 */
async function pauseChallenge(req, res) {
  try {
    const updated = await challengeService.togglePause(
      req.user._id,
      req.params.id,
      true
    );
    return res.status(200).json({
      success: true,
      message: "Challenge paused",
      data: updated,
    });
  } catch (error) {
    console.error("Error pausing challenge:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to pause challenge",
    });
  }
}

/**
 * PATCH /api/challenges/:id/resume
 * Resume a paused challenge.
 */
async function resumeChallenge(req, res) {
  try {
    const updated = await challengeService.togglePause(
      req.user._id,
      req.params.id,
      false
    );
    return res.status(200).json({
      success: true,
      message: "Challenge resumed",
      data: updated,
    });
  } catch (error) {
    console.error("Error resuming challenge:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to resume challenge",
    });
  }
}

/**
 * DELETE /api/challenges/:id
 * Delete a challenge without deleting transactions.
 */
async function deleteChallenge(req, res) {
  try {
    const result = await challengeService.deleteChallenge(
      req.user._id,
      req.params.id
    );
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete challenge",
    });
  }
}

/**
 * GET /api/challenges/recommendations
 * Get personalized savings recommendations.
 */
async function getRecommendations(req, res) {
  try {
    const recommendations =
      await challengeService.getPersonalizedRecommendations(req.user._id);
    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch recommendations",
    });
  }
}

module.exports = {
  getChallenges,
  getActiveWidget,
  createChallenge,
  recordContribution,
  updateChallenge,
  pauseChallenge,
  resumeChallenge,
  deleteChallenge,
  getRecommendations,
};
