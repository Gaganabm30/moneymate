import api from "./api";

// GET /api/recurring
export const getRecurringPayments = async (params = {}) => {
  const response = await api.get("/recurring", { params });
  return response.data;
};

// GET /api/recurring/upcoming-bills
export const getUpcomingBills = async (limit = 10) => {
  const response = await api.get("/recurring/upcoming-bills", {
    params: { limit },
  });
  return response.data?.bills ?? [];
};

// GET /api/recurring/:id
export const getRecurringPaymentById = async (id) => {
  const response = await api.get(`/recurring/${id}`);
  return response.data?.schedule ?? response.data;
};

// POST /api/recurring
export const createRecurringPayment = async (data) => {
  const response = await api.post("/recurring", data);
  return response.data?.schedule ?? response.data;
};

// PUT /api/recurring/:id
export const updateRecurringPayment = async (id, data) => {
  const response = await api.put(`/recurring/${id}`, data);
  return response.data?.schedule ?? response.data;
};

// PATCH /api/recurring/:id/pause
export const pauseRecurringPayment = async (id) => {
  const response = await api.patch(`/recurring/${id}/pause`);
  return response.data?.schedule ?? response.data;
};

// PATCH /api/recurring/:id/resume
export const resumeRecurringPayment = async (id) => {
  const response = await api.patch(`/recurring/${id}/resume`);
  return response.data?.schedule ?? response.data;
};

// POST /api/recurring/:id/pay
export const markBillPaid = async (id, paymentData = {}) => {
  const response = await api.post(`/recurring/${id}/pay`, paymentData);
  return response.data;
};

// DELETE /api/recurring/:id
export const deleteRecurringPayment = async (id) => {
  const response = await api.delete(`/recurring/${id}`);
  return response.data;
};

// POST /api/recurring/process-due
export const processDueRecurringPayments = async () => {
  const response = await api.post("/recurring/process-due");
  return response.data;
};
