// src/utils/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1"; // Dùng /api/v1 trong dev (proxy bởi Vite)

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Hàm gọi API với access_token
export const fetchWithAuth = async (endpoint, options = {}) => {
  const accessToken = localStorage.getItem("accessToken");
  
  try {
    if (options.body) {
      console.log(">>> Request body:", options.body);
    }

    const config = {
      ...options,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers
      },
      data: options.body
    };

    const response = await axiosInstance(endpoint, config);
    return response.data;

  } catch (error) {
    if (error.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return fetchWithAuth(endpoint, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newToken}` }
        });
      } else {
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }
    }
    
    console.error("Lỗi API:", error.message);
    throw error.response?.data?.message || `Lỗi: ${error.message}`;
  }
};

// Hàm làm mới access_token
const refreshAccessToken = async () => {
  console.log("rftoken");
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }

  try {
    const response = await axiosInstance.post('/session/refresh', {
      refresh_token: refreshToken
    });

    const { access_token, refresh_token } = response.data.data;
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    return access_token;

  } catch (error) {
    console.error("Lỗi làm mới token:", error.message);
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }
};