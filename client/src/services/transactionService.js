import api from "./api";

// GET /api/transactions
export const getTransactions = async () => {
  const response = await api.get("/transactions");
  // Backend returns { success, count, transactions }
  return response.data?.transactions ?? [];
};

// POST /api/transactions
export const createTransaction = async (data) => {
  const response = await api.post("/transactions", data);
  return response.data?.transaction ?? response.data;
};

// PUT /api/transactions/:id
export const updateTransaction = async (id, data) => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data?.transaction ?? response.data;
};

// DELETE /api/transactions/:id
export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};