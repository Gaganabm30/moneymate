import api from "./api";

// GET /api/notifications
export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

// PATCH /api/notifications/mark-all-read
export const markAllNotificationsRead = async () => {
  const response = await api.patch("/notifications/mark-all-read");
  return response.data;
};

// DELETE /api/notifications/:id
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};
