// src/utils/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Remove withCredentials to avoid CORS issues with credentials
  withCredentials: false 
});

// API call function with access token
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
        throw new Error("Session expired. Please login again.");
      }
    }
    
    console.error("API Error:", error.message);
    throw error.response?.data?.message || `Error: ${error.message}`;
  }
};

// Refresh access token function
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
    console.error("Token refresh error:", error.message);
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }
};