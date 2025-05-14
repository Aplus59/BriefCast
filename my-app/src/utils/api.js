// src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1"; // Dùng /api/v1 trong dev (proxy bởi Vite)
// Hàm gọi API với access_token
export const fetchWithAuth = async (endpoint, options = {}) => {
  const accessToken = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    // Remove CORS headers since they should be set by the server, not the client
    // These headers are ignored by browsers when set on the client side for security reasons
    ...options.headers,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  try {
    if (options.body) {
      console.log(">>> Request body:", options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      // Add credentials option to handle CORS properly
      credentials: 'include',
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
      throw new Error(`Non-JSON response: ${data}`);
    }

    if (!response.ok) {
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchWithAuth(endpoint, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
          });
        } else {
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
      }
      throw new Error(data.message || `Lỗi: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Lỗi API:", error.message, error.stack);
    throw error;
  }
};


// Hàm làm mới access_token
const refreshAccessToken = async () => {
  console.log("rftoken")
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/session/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
      throw new Error(`Non-JSON response: ${data}`);
    }

    if (response.ok) {
      localStorage.setItem("accessToken", data.data.access_token);
      localStorage.setItem("refreshToken", data.data.refresh_token);
      return data.data.access_token;
    } else {
      throw new Error("Không thể làm mới token.");
    }
  } catch (error) {
    console.error("Lỗi làm mới token:", error.message);
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }
};