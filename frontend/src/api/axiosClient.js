import axios from "axios";
import { endpoints } from "./endpoints";
const baseURL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/$/, "");
// Session persistence is a teaching tradeoff: tokens remain exposed to same-origin JS.
// A deployed backend can migrate refresh tokens to secure HttpOnly cookies.
export const tokens = {
  get: () => {
    try {
      return JSON.parse(sessionStorage.getItem("session") || "null");
    } catch {
      return null;
    }
  },
  set: (value) =>
    value
      ? sessionStorage.setItem("session", JSON.stringify(value))
      : sessionStorage.removeItem("session"),
};
export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
const refreshClient = axios.create({ baseURL, timeout: 15000 });
let refreshing;
api.interceptors.request.use((config) => {
  const access = tokens.get()?.access;
  if (access && ![endpoints.login, endpoints.register].includes(config.url))
    config.headers.Authorization = `Bearer ${access}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status !== 401 ||
      !config ||
      [endpoints.login, endpoints.register].includes(config.url)
    )
      return Promise.reject(error);
    if (config._retry) {
      tokens.set(null);
      window.dispatchEvent(new Event("session-expired"));
      return Promise.reject(error);
    }
    config._retry = true;
    const refresh = tokens.get()?.refresh;
    if (!refresh) {
      tokens.set(null);
      window.dispatchEvent(new Event("session-expired"));
      return Promise.reject(error);
    }
    try {
      refreshing ||= refreshClient
        .post(endpoints.refresh, { refresh })
        .then(({ data }) => {
          if (tokens.get()?.refresh !== refresh)
            throw new axios.CanceledError("Session changed during refresh.");
          tokens.set({ ...tokens.get(), ...data });
          return data.access;
        })
        .finally(() => {
          refreshing = null;
        });
      config.headers.Authorization = `Bearer ${await refreshing}`;
      return api(config);
    } catch (refreshError) {
      if (!axios.isCancel(refreshError)) {
        tokens.set(null);
        window.dispatchEvent(new Event("session-expired"));
      }
      return Promise.reject(refreshError);
    }
  },
);
export function errorMessage(error) {
  if (!error?.response)
    return "Backend API is unavailable. Start your Django server at localhost:8000.";
  const flatten = (value) =>
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value.map(flatten).join(" ")
        : value && typeof value === "object"
          ? Object.entries(value)
              .map(
                ([key, val]) =>
                  `${key === "detail" ? "" : `${key}: `}${flatten(val)}`,
              )
              .join(" ")
          : String(value ?? "");
  return (
    flatten(error.response.data) ||
    `Request failed (${error.response.status}). Please try again.`
  );
}
