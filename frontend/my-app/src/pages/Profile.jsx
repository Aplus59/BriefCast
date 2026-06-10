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

const SkeletonProfile = () => (
  <div className="flex flex-col md:flex-row gap-10 w-full max-w-5xl animate-pulse">
    <div className="flex flex-col items-center gap-4 rounded-lg shadow p-8">
      <div className="w-[150px] h-[150px] bg-gray-300 rounded-full"></div>
      <div className="h-4 bg-gray-300 rounded w-40"></div>
    </div>
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
  const language = localStorage.getItem("language") || "en";
  const [tabIndex, setTabIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  const voiceOptions = [
    { value: "male", label: language === "fr" ? "Voix masculine" : "Male voice" },
    { value: "female", label: language === "fr" ? "Voix féminine" : "Female voice" }
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    defaultVoice: "male",
    password: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [userID, setUserID] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    passLength: language === "fr" ? "Le mot de passe doit comporter au moins 9 caractères." : "Password must be at least 9 characters.",
    passLower: language === "fr" ? "Le mot de passe doit contenir au moins une lettre minuscule." : "Password must contain at least one lowercase letter.",
    passUpper: language === "fr" ? "Le mot de passe doit contenir au moins une lettre majuscule." : "Password must contain at least one uppercase letter.",
    passNumber: language === "fr" ? "Le mot de passe doit contenir au moins un chiffre." : "Password must contain at least one number.",
    passSpecial: language === "fr" ? "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)." : "Password must contain at least one special character (!@#$%^&*).",
    fetchError: language === "fr" ? "Impossible de charger les informations utilisateur :" : "Unable to load user information:",
    imgSize: language === "fr" ? "L'image doit faire moins de 1Mo" : "Image must be under 1MB",
    fillInfo: language === "fr" ? "Veuillez remplir le nom et l'email." : "Please fill in your name and email.",
    notFoundError: language === "fr" ? "Utilisateur introuvable. Veuillez vous reconnecter." : "User not found. Please log in again.",
    updateSuccess: language === "fr" ? "Profil mis à jour avec succès !" : "Profile updated successfully!",
    emailInUse: language === "fr" ? "Email déjà utilisé." : "Email already in use.",
    noPermission: language === "fr" ? "Vous n'avez pas la permission de mettre à jour ceci." : "You do not have permission to update this.",
    updateError: language === "fr" ? "Mise à jour impossible :" : "Unable to update:",
    fillPass: language === "fr" ? "Veuillez remplir tous les champs de mot de passe." : "Please fill in all password fields.",
    passMismatch: language === "fr" ? "Le nouveau mot de passe et la confirmation ne correspondent pas." : "New password and confirmation do not match.",
    passChangeSuccess: language === "fr" ? "Mot de passe modifié avec succès ! Déconnexion..." : "Password changed successfully! Logging out...",
    wrongPass: language === "fr" ? "Le mot de passe actuel est incorrect." : "Current password is incorrect.",
    invalidConfirm: language === "fr" ? "Le mot de passe de confirmation est invalide." : "Confirmation password is invalid.",
    passChangeError: language === "fr" ? "Impossible de changer le mot de passe :" : "Unable to change password:",
    logoutSuccess: language === "fr" ? "Déconnexion réussie !" : "Logout successful!",
    logoutError: language === "fr" ? "Une erreur est survenue lors de la déconnexion :" : "An error occurred during logout:",
    imgFormatReq: language === "fr" ? "L'image doit faire moins de 1Mo et avoir un ratio 1:1" : "Image must be under 1MB and have a 1:1 ratio",
    tabInfo: language === "fr" ? "Informations personnelles" : "Personal Information",
    tabPass: language === "fr" ? "Changer le mot de passe" : "Change Password",
    fullName: language === "fr" ? "Nom complet" : "Full Name",
    email: language === "fr" ? "Email" : "Email",
    defaultVoiceLabel: language === "fr" ? "Voix par défaut" : "Default Voice",
    saveChanges: language === "fr" ? "Enregistrer" : "Save Changes",
    logoutBtn: language === "fr" ? "Se déconnecter" : "Log Out",
    currentPass: language === "fr" ? "Mot de passe actuel" : "Current Password",
    newPass: language === "fr" ? "Nouveau mot de passe" : "New Password",
    confirmNewPass: language === "fr" ? "Confirmer le nouveau mot de passe" : "Confirm New Password",
    uploadPhoto: language === "fr" ? "Télécharger une photo" : "Upload Photo",
  };

  const validatePassword = (password) => {
    if (password.length < 9) return t.passLength;
    if (!/[a-z]/.test(password)) return t.passLower;
    if (!/[A-Z]/.test(password)) return t.passUpper;
    if (!/\d/.test(password)) return t.passNumber;
    if (!/[!@#$%^&*]/.test(password)) return t.passSpecial;
    return null;
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userData = {
          name: localStorage.getItem("username") || "",
          email: localStorage.getItem("email") || "",
          avatar: localStorage.getItem("avatar") || "",
          defaultVoice: localStorage.getItem("voice") || "male",
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
        
        const apiVoice = apiUser.voice || apiUser.defaultVoice || "male";

        setFormData((prev) => ({
          ...prev,
          name: apiUser.username || prev.name,
          email: apiUser.email || prev.email,
          defaultVoice: apiVoice,
        }));
        setUserID(apiUser.id);
        setProfilePhoto(apiUser.avatar || userData.avatar || null);
        localStorage.setItem("userId", apiUser.id);
        localStorage.setItem("voice", apiVoice);
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert(`${t.fetchError} ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

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
      alert(t.imgSize);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleToggleNewPassword = () => setShowNewPassword(!showNewPassword);
  const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSaveProfile = async () => {
    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        alert(t.fillInfo);
        return;
      }

      if (!userID) {
        alert(t.notFoundError);
        navigate("/login");
        return;
      }

      await fetchWithAuth(`/users/${userID}`, {
        method: "PATCH",
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          avatar: profilePhoto,
          voice: formData.defaultVoice,
        }),
      });

      localStorage.setItem("username", formData.name);
      localStorage.setItem("email", formData.email);
      localStorage.setItem("avatar", profilePhoto || "");
      localStorage.setItem("voice", formData.defaultVoice);
      alert(t.updateSuccess);
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.code;

      switch (errorCode) {
        case 20004:
          alert(t.notFoundError);
          break;
        case 20007:
          alert(t.emailInUse);
          break;
        case 20009:
          alert(t.noPermission);
          break;
        default:
          alert(`${t.updateError} ${errorMessage}`);
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
        alert(t.fillPass);
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        alert(t.passMismatch);
        return;
      }

      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        alert(passwordError);
        return;
      }

      if (!userID) {
        alert(t.notFoundError);
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
      await fetchWithAuth(`/users/${userID}/change-password`, config);

      alert(t.passChangeSuccess);
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
          alert(t.notFoundError);
          break;
        case 20005:
          alert(t.wrongPass);
          break;
        case 20008:
          alert(t.invalidConfirm);
          break;
        case 20009:
          alert(t.noPermission);
          break;
        default:
          alert(`${t.passChangeError} ${errorMessage}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth("/session/signout", {
        method: "DELETE",
      });

      localStorage.clear();
      alert(t.logoutSuccess);
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error.message);
      alert(`${t.logoutError} ${error.message}`);
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
                  <span className="text-sm">{t.uploadPhoto}</span>
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
              {t.imgFormatReq}
            </p>
          </div>

          <div className="flex-1">
            <Tabs
              value={tabIndex}
              onChange={(e, newValue) => setTabIndex(newValue)}
              textColor="primary"
              indicatorColor="primary"
              className="mb-6"
            >
              <Tab label={t.tabInfo} />
              <Tab label={t.tabPass} />
            </Tabs>

            {tabIndex === 0 && (
              <div className="flex flex-col gap-6 min-h-[320px]">
                <TextField
                  label={t.fullName}
                  name="name"
                  variant="outlined"
                  fullWidth
                  value={formData.name}
                  onChange={handleChange}
                />
                <TextField
                  label={t.email}
                  name="email"
                  variant="outlined"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange}
                />
                <FormControl fullWidth variant="outlined">
                  <InputLabel>{t.defaultVoiceLabel}</InputLabel>
                  <Select
                    label={t.defaultVoiceLabel}
                    name="defaultVoice"
                    value={formData.defaultVoice}
                    onChange={handleChange}
                  >
                    {voiceOptions.map((voice) => (
                      <MenuItem key={voice.value} value={voice.value}>
                        {voice.label}
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
                    {t.saveChanges}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    className="hover:bg-red-700"
                    onClick={handleLogout}
                  >
                    {t.logoutBtn}
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
                  label={t.currentPass}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder={t.currentPass}
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
                  label={t.newPass}
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder={t.newPass}
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
                  label={t.confirmNewPass}
                  name="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder={t.confirmNewPass}
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
                  {t.saveChanges}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}