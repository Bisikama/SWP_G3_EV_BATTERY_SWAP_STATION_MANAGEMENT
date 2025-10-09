// Axios configuration

import axios from "axios";
import { clearAuth } from "./auth";

// Base URL from environment variables
const baseURL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
export const api = axios.create({
    baseURL,
    withCredentials: false,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized
        if (error?.response?.status === 401) {
            console.warn("API 401 Unauthorized:", error?.config?.url);
            try {
                clearAuth();
                window.dispatchEvent(new CustomEvent("app:unauthorized", {
                    detail: { message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }
                }));
                if (window.location.pathname !== "/login") {
                    window.location.assign("/login");
                }
            } catch { }
        }

        // Handle 403 Forbidden
        if (error?.response?.status === 403) {
            console.warn("API 403 Forbidden:", error?.config?.url);
            window.dispatchEvent(new CustomEvent("app:forbidden", {
                detail: { message: "Bạn không có quyền truy cập tài nguyên này." }
            }));
        }

        return Promise.reject(error);
    }
);

// Helper function to set auth token
export function setAuthToken(token) {
    if (token) {
        localStorage.setItem("authToken", token);
    } else {
        localStorage.removeItem("authToken");
    }
}

// Helper function to get auth token
export function getAuthToken() {
    return localStorage.getItem("authToken");
}