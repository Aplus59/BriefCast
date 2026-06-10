import { Avatar, Badge, IconButton, InputBase } from "@mui/material";
import { FavoriteBorder, NotificationsNone } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NewspaperIcon from '@mui/icons-material/Newspaper';

export default function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  useEffect(() => {
    const avatar = localStorage.getItem("avatar") || "";
    setUserAvatar(avatar);
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  const handleLanguageToggle = () => {
    const newLang = language === "en" ? "fr" : "en";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent("languageChange", { detail: { language: newLang } }));
    // Reload current page to re-fetch articles in the new language
    window.location.reload();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = (event) => {
    if (event.key === "Enter" && searchQuery.trim()) {
      const queryParams = new URLSearchParams();
      queryParams.append("search", searchQuery.trim());

      localStorage.removeItem("topic_title");

      navigate(`/papers?${queryParams.toString()}`);
      setSearchQuery("");
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  // Handle click on Favorite button
  const handleFavoriteClick = () => {
    localStorage.setItem("topic_title", "Favorites");
    localStorage.removeItem("search_query");
    navigate("/papers?favorite=true");
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white shadow-sm space-y-2 sm:space-y-0">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={handleLogoClick}>
        <NewspaperIcon />
        <span className="text-2xl font-bold">Briefly</span>
      </div>

      <div className="w-full sm:w-auto flex-1 sm:mx-8 flex flex-col sm:flex-row items-center justify-start space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 flex-1 w-full sm:w-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <InputBase
            placeholder={language === "fr" ? "Que voulez-vous apprendre..." : "What do you want to learn..."}
            fullWidth
            inputProps={{ "aria-label": "search" }}
            className="w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleSearch}
          />
        </div>

        {/* Language Toggle */}
        <button
          id="language-toggle-btn"
          onClick={handleLanguageToggle}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 font-semibold text-sm transition-all duration-200"
          style={{
            borderColor: language === "fr" ? "#0055A4" : "#CF101A",
            color: language === "fr" ? "#0055A4" : "#CF101A",
            background: language === "fr" ? "#eef3ff" : "#fff5f5",
          }}
          title={`Switch to ${language === "en" ? "French" : "English"}`}
        >
          <span style={{ fontSize: "1rem" }}>{language === "en" ? "🇬🇧" : "🇫🇷"}</span>
          <span>{language === "en" ? "EN" : "FR"}</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 mt-2 sm:mt-0">
        <IconButton>
          <Badge color="error" variant="dot" overlap="circular">
            <NotificationsNone />
          </Badge>
        </IconButton>
        <IconButton onClick={handleFavoriteClick}>
          <FavoriteBorder />
        </IconButton>
        {isLoggedIn ? (
          <Avatar
            onClick={() => navigate(`/profile`)}
            src={userAvatar || "/avatar.jpg"}
            alt="User"
            className="cursor-pointer"
          />
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
          >
            {language === "fr" ? "Se connecter" : "Sign In"}
          </button>
        )}
      </div>
    </header>
  );
}