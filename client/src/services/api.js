import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("moneymate_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 (expired / invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("moneymate_token");
      localStorage.removeItem("moneymate_user");
      // Only redirect if not already on an auth page
      const pathname = window.location.pathname;
      if (!["/login", "/register", "/", "/forgot-password"].includes(pathname)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service API methods
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logoutUser = async () => {
  localStorage.removeItem("moneymate_token");
  localStorage.removeItem("moneymate_user");
};

export default api;