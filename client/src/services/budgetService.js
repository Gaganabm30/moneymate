import api from "./api";

// GET /api/budgets?month=M&year=Y
export const getBudgets = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const response = await api.get("/budgets", { params });
  // Backend returns an array directly
  return Array.isArray(response.data) ? response.data : [];
};

// POST /api/budgets
export const createBudget = async (data) => {
  const response = await api.post("/budgets", data);
  return response.data;
};

// PUT /api/budgets/:id
export const updateBudget = async (id, data) => {
  const response = await api.put(`/budgets/${id}`, data);
  return response.data;
};

// DELETE /api/budgets/:id
export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};