import axios from "axios";

// Di development, "/api" diteruskan ke server Express lewat proxy Vite.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getErrorMessage = (error, fallback = "Terjadi kesalahan.") =>
  error?.response?.data?.message || fallback;

export default api;
