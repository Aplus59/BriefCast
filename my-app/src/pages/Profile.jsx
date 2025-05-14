import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  Avatar,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Visibility, VisibilityOff, UploadFile } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";

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

// Skeleton cho Profile
const SkeletonProfile = () => (
  <div className="flex flex-col md:flex-row gap-10 w-full max-w-5xl animate-pulse">
    {/* Left side - Profile Photo */}
    <div className="flex flex-col items-center gap-4 rounded-lg shadow p-8">
      <div className="w-[150px] h-[150px] bg-gray-300 rounded-full"></div>
      <div className="h-4 bg-gray-300 rounded w-40"></div>
    </div>
    {/* Right side - Tabs */}
    <div className="flex-1">
      <div className="h-10 bg-gray-300 rounded mb-6"></div>
      <div className="flex flex-col gap-6 min-h-[320px]">
        <div className="h-14 bg-gray-300 rounded"></div>
        <div className="h-14 bg-gray-300 rounded"></div>
        <div className="h-14 bg-gray-300 rounded"></div>
        <div className="flex gap-4 mt-4 justify-between">
          <div className="h-10 bg-gray-300 rounded w-32"></div>
          <div className="h-10 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    defaultVoice: "Giọng nam",
    password: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [userID, setUserID] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Thêm trạng thái loading

  const voiceOptions = ["Giọng nam", "Giọng nữ"];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true); // Bắt đầu loading
        const userData = {
          name: localStorage.getItem("username") || "",
          email: localStorage.getItem("email") || "",
          avatar: localStorage.getItem("avatar") || "",
          defaultVoice: localStorage.getItem("voice") || "Giọng nam",
          userId: localStorage.getItem("userId") || "",
        };
        setUserID(userData.userId);
        setFormData((prev) => ({
          ...prev,
          name: userData.name,
          email: userData.email,
          defaultVoice: userData.defaultVoice,
        }));
        setProfilePhoto(userData.avatar || null);

        const response = await fetchWithAuth("/users/me", {
          method: "GET",
        });
        const apiUser = response.data;
        setFormData((prev) => ({
          ...prev,
          name: apiUser.username || prev.name,
          email: apiUser.email || prev.email,
          defaultVoice: apiUser.defaultVoice || prev.defaultVoice,
        }));
        setUserID(apiUser.id);
        setProfilePhoto(apiUser.avatar || userData.avatar || null);
        localStorage.setItem("userId", apiUser.id);
        localStorage.setItem("defaultVoice", apiUser.defaultVoice || userData.defaultVoice);
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Không thể tải thông tin người dùng: " + error.message);
      } finally {
        setIsLoading(false); // Kết thúc loading
      }
    };

    loadUserData();
  }, []);

  const printCurlCommand = (url, config, method = "GET") => {
    const { headers, body } = config;
    const headerStrings = Object.entries(headers || {}).map(([key, value]) => `-H "${key}: ${value}"`);
    const bodyString = body ? `-d '${body}'` : "";
    const curlCommand = [
      `curl -X ${method}`,
      `"${url}"`,
      ...headerStrings,
      bodyString,
    ]
      .filter(Boolean)
      .join(" \\\n  ");
    console.log("Curl command:\n", curlCommand);
    return curlCommand;
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
        localStorage.setItem("avatar", reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Ảnh phải dưới 1MB");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSaveProfile = async () => {
    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        alert("Vui lòng điền đầy đủ họ và tên và email.");
        return;
      }

      if (!userID) {
        alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      const voiceValue = formData.defaultVoice === "Giọng nam" ? "male" : "female";

      const response = await fetchWithAuth(`/users/${userID}`, {
        method: "PATCH",
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          avatar: profilePhoto,
          voice: voiceValue,
        }),
      });

      localStorage.setItem("username", formData.name);
      localStorage.setItem("email", formData.email);
      localStorage.setItem("avatar", profilePhoto || "");
      localStorage.setItem("voice", formData.defaultVoice);
      console.log("response", response)
      alert("Cập nhật thông tin cá nhân thành công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.code;

      switch (errorCode) {
        case 20004:
          alert("Không tìm thấy người dùng.");
          break;
        case 20007:
          alert("Email đã được sử dụng.");
          break;
        case 20009:
          alert("Bạn không có quyền cập nhật thông tin này.");
          break;
        default:
          alert("Không thể cập nhật thông tin: " + errorMessage);
      }
    }
  };

  const handleChangePassword = async () => {
    try {
      if (
        !formData.password.trim() ||
        !formData.newPassword.trim() ||
        !formData.confirmNewPassword.trim()
      ) {
        alert("Vui lòng điền đầy đủ các trường mật khẩu.");
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        alert("Mật khẩu mới và xác nhận mật khẩu không khớp.");
        return;
      }

      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        alert(passwordError);
        return;
      }

      if (!userID) {
        alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      const config = {
        method: "PATCH",
        body: JSON.stringify({
          new_password: formData.newPassword,
          old_password: formData.password,
        }),
      };
      printCurlCommand(`/users/${userID}/change-password`, config, "PATCH");
      await fetchWithAuth(`/users/${userID}/change-password`, config);

      alert("Đổi mật khẩu thành công! Đăng xuất hệ thống.");
      setFormData((prev) => ({
        ...prev,
        password: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
      await handleLogout();
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.code;

      switch (errorCode) {
        case 20004:
          alert("Không tìm thấy người dùng.");
          break;
        case 20005:
          alert("Mật khẩu hiện tại không đúng.");
          break;
        case 20008:
          alert("Mật khẩu xác nhận không hợp lệ.");
          break;
        case 20009:
          alert("Bạn không có quyền đổi mật khẩu.");
          break;
        default:
          alert("Không thể đổi mật khẩu: " + errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Sending logout request to: /api/v1/session/signout");
      const response = await fetchWithAuth("/session/signout", {
        method: "DELETE",
      });

      console.log("Logout API response:", response);

      localStorage.clear();
      alert("Đăng xuất thành công!");
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error.message);
      alert("Đã xảy ra lỗi khi đăng xuất: " + error.message);
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="flex justify-center items-start p-6 mt-20 lg:px-28">
      {isLoading ? (
        <SkeletonProfile />
      ) : (
        <div className="flex flex-col md:flex-row gap-10 w-full max-w-5xl">
          {/* Left side - Profile Photo */}
          <div className="flex flex-col items-center gap-4 rounded-lg shadow p-8">
            <div className="relative">
              <Avatar
                src={profilePhoto}
                alt="Profile"
                sx={{ width: 150, height: 150 }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white flex justify-center items-center h-10">
                <label className="cursor-pointer flex items-center gap-1">
                  <UploadFile fontSize="small" className="profile" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            </div>
            <p className="text-gray-500 text-sm text-center">
              Ảnh phải dưới 1MB và tỷ lệ ảnh cần là 1:1
            </p>
          </div>

          {/* Right side - Tabs */}
          <div className="flex-1">
            <Tabs
              value={tabIndex}
              onChange={(e, newValue) => setTabIndex(newValue)}
              textColor="primary"
              indicatorColor="primary"
              className="mb-6"
            >
              <Tab label="Thông tin cá nhân" />
              <Tab label="Đổi mật khẩu" />
            </Tabs>

            {tabIndex === 0 && (
              <div className="flex flex-col gap-6 min-h-[320px]">
                <TextField
                  label="Họ và tên"
                  name="name"
                  variant="outlined"
                  fullWidth
                  value={formData.name}
                  onChange={handleChange}
                />
                <TextField
                  label="Email"
                  name="email"
                  variant="outlined"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange}
                />
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Giọng mặc định</InputLabel>
                  <Select
                    label="Giọng mặc định"
                    name="defaultVoice"
                    value={formData.defaultVoice}
                    onChange={handleChange}
                  >
                    {voiceOptions.map((voice) => (
                      <MenuItem key={voice} value={voice}>
                        {voice}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <div className="flex gap-4 mt-4 justify-between">
                  <Button
                    variant="contained"
                    color="primary"
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={handleSaveProfile}
                  >
                    Lưu Thay Đổi
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    className="hover:bg-red-700"
                    onClick={handleLogout}
                  >
                    Đăng Xuất
                  </Button>
                </div>
              </div>
            )}

            {tabIndex === 1 && (
              <form autoComplete="off" className="flex flex-col gap-6 min-h-[320px]">
                <input
                  type="password"
                  style={{ display: "none" }}
                  autoComplete="new-password"
                />
                <TextField
                  fullWidth
                  label="Mật khẩu hiện tại"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Mật khẩu hiện tại"
                  autoComplete="off"
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
                <TextField
                  fullWidth
                  label="Mật khẩu mới"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Mật khẩu mới"
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleToggleNewPassword} edge="end">
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Nhập lại mật khẩu mới"
                  name="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleToggleConfirmPassword} edge="end">
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={handleChangePassword}
                >
                  Lưu Thay Đổi
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}