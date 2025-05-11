import React, { useState } from "react";
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import illustration from "../../assets/images/illustrations.png";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    // Validate input fields
    if (!formData.email.trim() || !formData.password.trim()) {
      alert("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }
  
    // Validate Gmail format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email.trim())) {
      alert("Vui lòng nhập địa chỉ Gmail hợp lệ (ví dụ: example@gmail.com).");
      return;
    }
  
    try {
      console.log("Sending request with payload:", JSON.stringify({
        email: formData.email,
        password: formData.password,
      }));
  
      const response = await fetch("/api/v1/session/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Swagger-Codegen/1.0.0/go",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
  
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
        console.log("Non-JSON response:", data);
        throw new Error(`Non-JSON response: ${data}`);
      }
  
      console.log("Full response:", JSON.stringify(data, null, 2));
      console.log("Data object:", data.data);
      console.log("User object:", data.data?.user);
  
      if (response.ok) {
        if (!data.data || typeof data.data !== "object") {
          throw new Error("Data object is missing or invalid in response");
        }
        if (!data.data.user || typeof data.data.user !== "object") {
          throw new Error("User object is missing or invalid in response");
        }
  
        const user = data.data.user;
        console.log("Đăng nhập thành công:", data.data);
  
        // Store data in localStorage
        localStorage.setItem("accessToken", data.data.access_token);
        localStorage.setItem("refreshToken", data.data.refresh_token);
        localStorage.setItem("userId", user.id || "unknown");
        localStorage.setItem("email", user.email || formData.email);
        localStorage.setItem("username", user.username || "");
        localStorage.setItem("role", user.role || "USER");
        localStorage.setItem("avatar", user.avatar || "");

        const voiceValue = (user.voice || "male") === "male" ? "Giọng nam" : "Giọng nữ";
        localStorage.setItem("voice", voiceValue);

        alert("Đăng nhập thành công!");
        navigate("/"); // Redirect to dashboard
      } else {
        const errorMessage = {
          20004: "Tài khoản không tồn tại.",
          20005: "Mật khẩu không đúng.",
          20007: "Email đã được sử dụng.",
        }[data.code] || data.message || `Lỗi: ${response.status} ${response.statusText}`;
        alert(`Đăng nhập thất bại: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error.message, error.stack);
      alert("Đã xảy ra lỗi khi kết nối đến server: " + error.message);
    }
  };
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-2/5 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <img
            src={illustration}
            alt="Minh họa đăng nhập"
            className="w-full h-full mx-auto"
          />
        </div>
      </div>
      <div className="w-3/5 flex items-center justify-center">
        <div className="w-1/2 h-1/2">
          <h1 className="text-5xl font-bold mb-20 text-center">Đăng nhập</h1>
          <div className="space-y-9">
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              placeholder="Email"
            />
            <TextField
              fullWidth
              label="Mật khẩu"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              placeholder="Mật khẩu"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </div>
          <div className="flex flex-row justify-between mt-5">
            <div className="">
              <Link href="#" className="orange">
                Quên mật khẩu?
              </Link>
            </div>
            <div>
              <span>Bạn chưa có tài khoản? </span>
              <Link href="#" className="green" onClick={() => navigate("/register")} >
                Đăng ký
              </Link>
            </div>
          </div>
          <div className="text-right mt-10">
            <Button
              variant="contained"
              className="custom-button"
              onClick={handleSubmit}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;