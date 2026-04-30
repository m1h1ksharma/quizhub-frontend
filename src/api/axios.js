import axios from "axios";

// Ekdum saaf URL bina kisi extra slash ke
const base = "https://quizhub-backend-fesf.onrender.com/api";

const API = axios.create({
  baseURL: base, 
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debugging ke liye: console mein check kar sakte ho ki request kahan ja rahi hai
    console.log("Request URL:", config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;