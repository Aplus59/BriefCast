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

const Register = () => {
  const navigate = useNavigate();
  const language = localStorage.getItem("language") || "en";
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const t = {
    passLength: language === "fr" ? "Le mot de passe doit comporter au moins 9 caractères." : "Password must be at least 9 characters.",
    passLower: language === "fr" ? "Le mot de passe doit contenir au moins une lettre minuscule." : "Password must contain at least one lowercase letter.",
    passUpper: language === "fr" ? "Le mot de passe doit contenir au moins une lettre majuscule." : "Password must contain at least one uppercase letter.",
    passNumber: language === "fr" ? "Le mot de passe doit contenir au moins un chiffre." : "Password must contain at least one number.",
    passSpecial: language === "fr" ? "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)." : "Password must contain at least one special character (!@#$%^&*).",
    fillInfo: language === "fr" ? "Veuillez remplir toutes les informations." : "Please fill in all information.",
    invalidEmail: language === "fr" ? "Veuillez entrer une adresse Gmail valide (ex: example@gmail.com)." : "Please enter a valid Gmail address (e.g. example@gmail.com).",
    emailInUse: language === "fr" ? "L'email est déjà utilisé." : "Email is already in use.",
    invalidConfirm: language === "fr" ? "Le mot de passe de confirmation est invalide." : "Invalid confirmation password.",
    regFailed: language === "fr" ? "Échec de l'inscription :" : "Registration failed:",
    regSuccess: language === "fr" ? "Compte créé avec succès ! Connexion automatique." : "Account created successfully! Automatic login.",
    illustration: language === "fr" ? "Illustration d'inscription" : "Registration illustration",
    createAccount: language === "fr" ? "Créer un compte" : "Create Account",
    username: language === "fr" ? "Nom d'utilisateur" : "Username",
    email: language === "fr" ? "Adresse Email" : "Email Address",
    password: language === "fr" ? "Mot de passe" : "Password",
    createPassword: language === "fr" ? "Créer un mot de passe" : "Create password",
    haveAccount: language === "fr" ? "Vous avez déjà un compte ? " : "Already have an account? ",
    login: language === "fr" ? "Se connecter" : "Log in",
  };

  const validatePassword = (password) => {
    if (password.length < 9) return t.passLength;
    if (!/[a-z]/.test(password)) return t.passLower;
    if (!/[A-Z]/.test(password)) return t.passUpper;
    if (!/\d/.test(password)) return t.passNumber;
    if (!/[!@#$%^&*]/.test(password)) return t.passSpecial;
    return null;
  };

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

    if (!username.trim() || !email.trim() || !password.trim()) {
      alert(t.fillInfo);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email.trim())) {
      alert(t.invalidEmail);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    try {
      const data = await fetchWithAuth("/session/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          username,
        }),
        headers: {
          Authorization: undefined,
        },
      });

      if (!data.data || typeof data.data !== "object") {
        throw new Error("Data object is missing or invalid in response");
      }
      if (!data.data.user || typeof data.data.user !== "object") {
        throw new Error("User object is missing or invalid in response");
      }

      const user = data.data.user;

      localStorage.setItem("accessToken", data.data.access_token);
      localStorage.setItem("refreshToken", data.data.refresh_token);
      localStorage.setItem("userId", user.id || "unknown");
      localStorage.setItem("email", user.email || email);
      localStorage.setItem("username", user.username || username);
      localStorage.setItem("role", user.role || "USER");
      localStorage.setItem("avatar", user.avatar || "");

      alert(t.regSuccess);
      navigate("/");
    } catch (error) {
      console.error("Lỗi kết nối:", error.message, error.stack);
      const errorMessage = {
        20007: t.emailInUse,
        20008: t.invalidConfirm,
      }[error.code] || error.message || t.regFailed;
      alert(`${t.regFailed} ${errorMessage}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-2/5 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <img
            src={illustration}
            alt={t.illustration}
            className="w-full h-full mx-auto"
          />
        </div>
      </div>

      <div className="w-3/5 flex items-center justify-center">
        <div className="w-1/2 h-2/3">
          <h1 className="text-5xl font-bold mb-20 text-center">{t.createAccount}</h1>

          <div className="space-y-9">
            <TextField
              fullWidth
              label={t.username}
              name="username"
              value={formData.username}
              onChange={handleChange}
              variant="outlined"
              placeholder={t.username}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              placeholder={t.email}
            />

            <TextField
              fullWidth
              label={t.password}
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              placeholder={t.createPassword}
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
            <div>
              <span>{t.haveAccount}</span>
              <Link href="#" className="green" onClick={() => navigate("/login")}>
                {t.login}
              </Link>
            </div>
          </div>

          <div className="text-right mt-10">
            <Button
              variant="contained"
              className="custom-button"
              onClick={handleSubmit}
            >
              {t.createAccount}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;