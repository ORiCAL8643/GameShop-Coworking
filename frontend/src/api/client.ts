import axios from "axios";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8088";
export const api = axios.create({ baseURL: API_BASE, withCredentials: true });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
