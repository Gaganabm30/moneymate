import api from "./api";

export const getBudgets = async () => {
  const response = await api.get("/budgets");
  return response.data;
};

export const createBudget = async (data) => {
  const response = await api.post("/budgets", data);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};