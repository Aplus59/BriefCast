import { Avatar, Badge, IconButton, InputBase, Select, MenuItem, TextField } from "@mui/material";
import { FavoriteBorder, NotificationsNone } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NewspaperIcon from '@mui/icons-material/Newspaper';

export default function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    const avatar = localStorage.getItem("avatar") || "";
    setUserAvatar(avatar);
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleToDateChange = (event) => {
    setToDate(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  const handleSearch = (event) => {
    if (event.key === "Enter" && searchQuery.trim()) {
      const queryParams = new URLSearchParams();
      queryParams.append("search", searchQuery.trim());
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);
      queryParams.append("sort", sortOrder);

      localStorage.setItem("search_query", searchQuery.trim());
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
        <span className="text-2xl font-bold">E-new</span>
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
            placeholder="What do you want to learn..."
            fullWidth
            inputProps={{ "aria-label": "search" }}
            className="w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleSearch}
          />
        </div>
        <div className="flex items-center space-x-2">
          <TextField
            label="Từ ngày"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 140 }}
            value={fromDate}
            onChange={handleFromDateChange}
          />
          <TextField
            label="Đến ngày"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 140 }}
            value={toDate}
            onChange={handleToDateChange}
          />
        </div>
        <Select
          value={sortOrder}
          onChange={handleSortChange}
          className="w-32"
          size="small"
          sx={{ backgroundColor: "white", borderRadius: "8px" }}
        >
          <MenuItem value="newest">Mới nhất</MenuItem>
          <MenuItem value="oldest">Cũ nhất</MenuItem>
        </Select>
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
        <Avatar
          onClick={() => navigate(`/profile`)}
          src={userAvatar || "/avatar.jpg"}
          alt="User"
        />
      </div>
    </header>
  );
}