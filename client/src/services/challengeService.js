import api from "./api";

/**
 * Get all challenges, summary, achievements, and recommendations.
 */
export async function getChallenges() {
  const res = await api.get("/challenges");
  return res.data.data;
}

/**
 * Get active challenge widget data for the dashboard.
 */
export async function getChallengeWidget() {
  const res = await api.get("/challenges/widget");
  return res.data.data;
}

/**
 * Get personalized savings recommendations.
 */
export async function getRecommendations() {
  const res = await api.get("/challenges/recommendations");
  return res.data.data;
}

/**
 * Create a new savings challenge.
 */
export async function createChallenge(data) {
  const res = await api.post("/challenges", data);
  return res.data.data;
}

/**
 * Record a contribution to a challenge.
 */
export async function recordContribution(challengeId, data) {
  const res = await api.post(`/challenges/${challengeId}/contribute`, data);
  return res.data.data;
}

/**
 * Update challenge details.
 */
export async function updateChallenge(challengeId, data) {
  const res = await api.put(`/challenges/${challengeId}`, data);
  return res.data.data;
}

/**
 * Pause a challenge.
 */
export async function pauseChallenge(challengeId) {
  const res = await api.patch(`/challenges/${challengeId}/pause`);
  return res.data.data;
}

/**
 * Resume a paused challenge.
 */
export async function resumeChallenge(challengeId) {
  const res = await api.patch(`/challenges/${challengeId}/resume`);
  return res.data.data;
}

/**
 * Delete a challenge (does NOT delete financial transactions).
 */
export async function deleteChallenge(challengeId) {
  const res = await api.delete(`/challenges/${challengeId}`);
  return res.data;
}
