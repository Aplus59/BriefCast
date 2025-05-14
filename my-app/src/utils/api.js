// src/utils/api.js
let API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1"; // Dùng /api/v1 trong dev (proxy bởi Vite)
// Hàm gọi API với access_token
export let fetchWithAuth = async (endpoint, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");

  let headers = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  try {
    if (options.body) {
      console.log(">>> Request body:", options.body);
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      mode: 'cors',
      credentials: 'include', // nếu backend yêu cầu cookie/session
    });

    let contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
      throw new Error(`Non-JSON response: ${data}`);
    }

    return data;

  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};


// Hàm làm mới access_token
let refreshAccessToken = async () => {
  console.log("rftoken")
  let refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }

  try {
    let response = await fetch(`${API_BASE_URL}/session/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Swagger-Codegen/1.0.0/go",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    let contentType = response.headers.get("content-type");
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