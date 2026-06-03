import axios from "axios";

// Base API configuration referencing standard local development backend port
const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("astro_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Globally trap 401 Unauthorized errors to trigger authentication logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logger_warn("Session expired or unauthorized. Logging out...");
      localStorage.removeItem("astro_token");
      localStorage.removeItem("astro_user");
      // Force page reload to clear Zustand store and redirect to login
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

function logger_warn(msg: string) {
  console.warn(`[API CLIENT] ${msg}`);
}

export default api;
