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
import { fetchWithAuth } from "../../utils/api";
const validatePassword = (password) => {
  if (password.length < 9) {
    return "Mật khẩu phải có ít nhất 9 ký tự.";
  }
  if (!/[a-z]/.test(password)) {
    return "Mật khẩu phải chứa ít nhất một chữ cái thường.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu phải chứa ít nhất một chữ cái in hoa.";
  }
  if (!/\d/.test(password)) {
    return "Mật khẩu phải chứa ít nhất một chữ số.";
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*).";
  }
  return null;
};

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

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    try {
      console.log("Sending request with payload:", JSON.stringify({
        email,
        password,
        username,
      }));

      const data = await fetchWithAuth("/session/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          username,
        }),
        headers: {
          Authorization: undefined, // Override to exclude Authorization header
        },
      });

      console.log("Full response:", JSON.stringify(data, null, 2));
      console.log("Data object:", data.data);
      console.log("User object:", data.data?.user);

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
    } catch (error) {
      console.error("Lỗi kết nối:", error.message, error.stack);
      const errorMessage = {
        20007: "Email đã được sử dụng.",
        20008: "Mật khẩu xác nhận không hợp lệ.",
      }[error.code] || error.message || "Đăng ký thất bại.";
      alert(`Đăng ký thất bại: ${errorMessage}`);
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