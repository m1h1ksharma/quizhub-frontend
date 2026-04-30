import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.14:9090/api",
  // headers: {
  //   "Content-Type": "application/json"
  // }
});

API.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;