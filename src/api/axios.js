import axios from "axios";

// Backend Base URL
const base = "https://quizhub-backend-fesf.onrender.com/api";

const API = axios.create({
  baseURL: base,
});

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // IMPORTANT:
    // Agar FormData hai toh browser khud multipart set karega
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    console.log("Request URL:", config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;