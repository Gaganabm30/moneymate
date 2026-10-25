import api from "./api";

/**
 * GET /api/ai/insights
 * Returns full financial analytics + optional AI summary.
 */
export const getAIInsights = async () => {
  const response = await api.get("/ai/insights");
  return response.data;
};

/**
 * POST /api/ai/chat
 * Send a financial question + session conversation history.
 */
export const sendAIChatMessage = async (message, history = []) => {
  const response = await api.post("/ai/chat", { message, history });
  return response.data;
};
