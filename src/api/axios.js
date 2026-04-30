import axios from "axios";

// Create React App mein 'process.env.REACT_APP_...' use hota hai.
// Agar environment variable nahi milta, toh humne fallback (default) URL bhi de diya hai.
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://quizhub-backend-fesf.onrender.com";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Har request ke saath Token bhejta hai
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Agar 401 (Unauthorized) aaye toh login par bhej de
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;