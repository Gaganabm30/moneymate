import api from "./api";

// GET /api/goals
export const getGoals = async () => {
  const response = await api.get("/goals");
  return Array.isArray(response.data) ? response.data : [];
};

// POST /api/goals
export const createGoal = async (data) => {
  const response = await api.post("/goals", data);
  return response.data;
};

// PUT /api/goals/:id
export const updateGoal = async (id, data) => {
  const response = await api.put(`/goals/${id}`, data);
  return response.data;
};

// DELETE /api/goals/:id
export const deleteGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};