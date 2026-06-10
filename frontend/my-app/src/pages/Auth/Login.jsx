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

const Login = () => {
  const navigate = useNavigate();
  const language = localStorage.getItem("language") || "en";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const t = {
    fillFields: language === "fr" ? "Veuillez remplir l'e-mail et le mot de passe." : "Please fill in both email and password.",
    invalidEmail: language === "fr" ? "Veuillez entrer une adresse Gmail valide (ex: example@gmail.com)." : "Please enter a valid Gmail address (e.g. example@gmail.com).",
    loginSuccess: language === "fr" ? "Connexion réussie !" : "Login successful!",
    accountNotFound: language === "fr" ? "Le compte n'existe pas." : "Account does not exist.",
    wrongPassword: language === "fr" ? "Mot de passe incorrect." : "Incorrect password.",
    emailInUse: language === "fr" ? "E-mail déjà utilisé." : "Email already in use.",
    loginError: language === "fr" ? "Une erreur s'est produite lors de la connexion." : "An error occurred during login.",
    loginFailed: language === "fr" ? "Échec de la connexion :" : "Login failed:",
    signIn: language === "fr" ? "Se connecter" : "Sign In",
    password: language === "fr" ? "Mot de passe" : "Password",
    forgotPassword: language === "fr" ? "Mot de passe oublié ?" : "Forgot password?",
    noAccount: language === "fr" ? "Vous n'avez pas de compte ? " : "Don't have an account? ",
    signUp: language === "fr" ? "S'inscrire" : "Sign Up",
    illustration: language === "fr" ? "Illustration de connexion" : "Login illustration",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      alert(t.fillFields);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email.trim())) {
      alert(t.invalidEmail);
      return;
    }

    try {
      const data = await fetchWithAuth("/session/signin", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
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
      localStorage.setItem("email", user.email || formData.email);
      localStorage.setItem("username", user.username || "");
      localStorage.setItem("role", user.role || "USER");
      localStorage.setItem("avatar", user.avatar || "");

      // Ensure voice is stored internally as "male"/"female" or localized later
      const voiceValue = (user.voice || "male") === "male" ? "male" : "female";
      localStorage.setItem("voice", voiceValue);

      alert(t.loginSuccess);
      navigate("/"); 
    } catch (error) {
      console.error("Lỗi đăng nhập:", error.message, error.stack);
      const errorMessage = {
        20004: t.accountNotFound,
        20005: t.wrongPassword,
        20007: t.emailInUse,
      }[error.code] || error.message || t.loginError;
      alert(`${t.loginFailed} ${errorMessage}`);
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
            alt={t.illustration}
            className="w-full h-full mx-auto"
          />
        </div>
      </div>
      <div className="w-3/5 flex items-center justify-center">
        <div className="w-1/2 h-1/2">
          <h1 className="text-5xl font-bold mb-20 text-center">{t.signIn}</h1>
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
              label={t.password}
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              placeholder={t.password}
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
                {t.forgotPassword}
              </Link>
            </div>
            <div>
              <span>{t.noAccount}</span>
              <Link href="#" className="green" onClick={() => navigate("/register")}>
                {t.signUp}
              </Link>
            </div>
          </div>
          <div className="text-right mt-10">
            <Button
              variant="contained"
              className="custom-button"
              onClick={handleSubmit}
            >
              {t.signIn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;