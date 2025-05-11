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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
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

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async () => {
    const { username, email, password } = formData;

    // Validate required fields
    if (!username.trim() || !email.trim() || !password.trim()) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    // Validate Gmail format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email.trim())) {
      alert("Vui lòng nhập địa chỉ Gmail hợp lệ (ví dụ: example@gmail.com).");
      return;
    }

    // Validate password length (optional, based on common requirements)
    if (password.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    try {
      console.log("Sending request with payload:", JSON.stringify({
        username,
        email,
        password,
      }));

      const response = await fetch("/api/v1/session/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Swagger-Codegen/1.0.0/go",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          username,
          email,
          password,
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
        console.log("Đăng ký thành công:", data.data);

        // Store data in localStorage (consistent with Login)
        localStorage.setItem("accessToken", data.data.access_token);
        localStorage.setItem("refreshToken", data.data.refresh_token);
        localStorage.setItem("userId", user.id || "unknown");
        localStorage.setItem("email", user.email || email);
        localStorage.setItem("username", user.username || username);
        localStorage.setItem("role", user.role || "USER");
        localStorage.setItem("avatar", user.avatar || "");

        alert("Tạo tài khoản thành công! Đăng nhập tự động.");
        navigate("/"); // Redirect to dashboard
      } else {
        const errorMessage = {
          20007: "Email đã được sử dụng.",
          20008: "Mật khẩu xác nhận không hợp lệ.",
        }[data.code] || data.message || `Lỗi: ${response.status} ${response.statusText}`;
        alert(`Đăng ký thất bại: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error.message, error.stack);
      alert("Đã xảy ra lỗi khi kết nối đến server: " + error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left side: Illustration */}
      <div className="w-2/5 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <img
            src={illustration}
            alt="Minh họa đăng ký"
            className="w-full h-full mx-auto"
          />
        </div>
      </div>

      {/* Right side: Registration form */}
      <div className="w-3/5 flex items-center justify-center">
        <div className="w-1/2 h-2/3">
          <h1 className="text-5xl font-bold mb-20 text-center">Tạo tài khoản</h1>

          {/* Form */}
          <div className="space-y-9">
            {/* Username */}
            <TextField
              fullWidth
              label="Tên tài khoản"
              name="username"
              value={formData.username}
              onChange={handleChange}
              variant="outlined"
              placeholder="Tên tài khoản"
            />

            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              placeholder="Địa chỉ Email"
            />

            {/* Password */}
            <TextField
              fullWidth
              label="Mật khẩu"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              placeholder="Tạo mật khẩu"
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

          {/* Links and Button */}
          <div className="flex flex-row justify-between mt-5">
            <div>
              <span>Bạn đã có tài khoản? </span>
              <Link href="#" className="green" onClick={() => navigate("/login")}>
                Đăng nhập
              </Link>
            </div>
          </div>

          <div className="text-right mt-10">
            <Button
              variant="contained"
              className="custom-button"
              onClick={handleSubmit}
            >
              Tạo tài khoản
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;