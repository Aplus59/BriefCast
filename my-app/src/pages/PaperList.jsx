import { useState, useEffect, useRef } from "react";
import NewsCard from "../components/common/NewsCard";
import { Pagination } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const defaultNewsItems = [
  {
    title: "Bộ Y tế công bố 21 loại thuốc giả",
    content: [
      "Bộ Y tế công bố 21 loại thuốc giả, gồm 4 thuốc tân dược giả mạo",
      "17 sản phẩm chưa được cấp phép.",
      "Các thuốc này do đường dây sản xuất giả quy mô lớn thực hiện, đã bị triệt phá.",
      "Bộ yêu cầu ngừng sử dụng ngay lập tức, cảnh báo nguồn gốc rõ ràng.",
    ],
    imageUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
    linkPaper: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
    datetime: "21/4/2025",
    id: "default-1",
    favorite: false,
    audioUrl: "https://example.com/audio/default-1.mp3",
  },
];

function PaperList() {
  const navigate = useNavigate();
  const itemsPerPage = 5;
  const [newsItems, setNewsItems] = useState(defaultNewsItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [isPlayingList, setIsPlayingList] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [singleAudioPlayingId, setSingleAudioPlayingId] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const query = useQuery();
  const search = query.get("search");
  const topicId = query.get("topic_id");
  const fromDate = query.get("from");
  const toDate = query.get("to");
  const favorite = query.get("favorite") === "true"; // Lấy tham số favorite từ query
  const sortOrder = query.get("sort") === "newest" ? "desc" : "asc";
  const topicTitle = localStorage.getItem("topic_title") || "";
  const searchQuery = localStorage.getItem("search_query") || "";
  const newsItemRefs = useRef([]);

  // Hàm tạo lệnh curl từ cấu hình axios
  const printCurlCommand = (url, config, method = "GET") => {
    const { headers, params } = config;
    const queryString = params ? `?${qs.stringify(params, { arrayFormat: "brackets", skipNulls: true })}` : "";
    const headerStrings = Object.entries(headers).map(([key, value]) => `-H "${key}: ${value}"`);
    const curlCommand = [
      `curl -X ${method}`,
      `"${url}${queryString}"`,
      ...headerStrings,
    ].join(" \\\n  ");
    console.log("Curl command:\n", curlCommand);
    return curlCommand;
  };

  // Hàm dừng audio hiện tại và reset trạng thái
  const stopCurrentAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
      setAudioElement(null);
    }
    setIsPlayingList(false);
    setIsPaused(false);
    setCurrentAudioIndex(-1);
    setSingleAudioPlayingId(null);
  };

  // Hàm fetch news (được gọi lại khi chuyển trang hoặc thay đổi query)
  const fetchNews = async (page) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const params = {
        search: search || undefined,
        topic_ids: topicId && topicId !== "latest" ? [topicId] : undefined,
        start_date: fromDate || undefined,
        end_date: toDate || undefined,
        favorite: favorite || undefined, // Thêm tham số favorite
        sort_by: "published_date",
        sort_order: sortOrder,
        page: page,
        limit: itemsPerPage,
      };

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          lang: "vi",
          Accept: "application/json",
        },
        params,
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "brackets", skipNulls: true });
        },
      };

      printCurlCommand("/api/v1/articles", config);

      const response = await axios.get("/api/v1/articles", config);
      console.log("API response:", response.data);

      if (response.data.data && Array.isArray(response.data.data.data)) {
        if (response.data.data.data.length === 0) {
          setNewsItems([]);
          setTotalPages(1);
          setError(favorite ? "Không tìm thấy bài viết yêu thích nào." : `Không tìm thấy bài viết nào cho chủ đề "${topicTitle}".`);
          return;
        }

        const formattedItems = response.data.data.data.map((item) => ({
          id: item.id || `fallback-${Math.random()}`,
          title: item.title || "Untitled",
          content: item.summary || ["No summary available"],
          imageUrl: item.image || "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
          linkPaper: item.url || "#",
          datetime: item.published_date || "N/A",
          source: item.source?.name || "Unknown",
          topic: item.topic?.name || "General",
          topicId: item.topic?.id || null,
          favorite: item.is_favorite || false,
          audioUrl: item.audio?.url || null,
        }));
        setNewsItems(formattedItems);
        setTotalPages(response.data.data.meta?.total_pages || 1);
        setError(null);
      } else {
        console.warn("Invalid API response, no data available.");
        setNewsItems([]);
        setTotalPages(1);
        setError("Dữ liệu từ server không hợp lệ.");
      }
    } catch (error) {
      console.error("API error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      } else {
        setNewsItems([]);
        setTotalPages(1);
        setError(
          error.response?.data?.message || "Không thể tải bài viết. Vui lòng thử lại sau."
        );
      }
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchNews(currentPage);
  }, [search, topicId, fromDate, toDate, favorite, sortOrder, currentPage, navigate]);

  // Cuộn đến bài viết đang phát
  useEffect(() => {
    if (isPlayingList && currentAudioIndex >= 0 && currentAudioIndex < newsItems.length) {
      const currentItemRef = newsItemRefs.current[currentAudioIndex];
      if (currentItemRef) {
        currentItemRef.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [currentAudioIndex, isPlayingList, newsItems]);

  // Quản lý phát audio tuần tự
  useEffect(() => {
    if (isPlayingList && !isPaused && currentAudioIndex >= 0 && currentAudioIndex < newsItems.length) {
      const audio = new Audio(newsItems[currentAudioIndex].audioUrl);
      setAudioElement(audio);

      audio.play().catch((err) => console.error("Audio play error:", err));

      audio.onended = () => {
        if (currentAudioIndex < newsItems.length - 1) {
          setCurrentAudioIndex(currentAudioIndex + 1);
        } else if (currentPage < totalPages) {
          setCurrentPage(currentPage + 1);
          setCurrentAudioIndex(0);
          setIsPlayingList(true);
        } else {
          stopCurrentAudio();
        }
      };

      return () => {
        audio.pause();
        audio.src = "";
      };
    }
  }, [currentAudioIndex, isPlayingList, isPaused, newsItems, currentPage, totalPages]);

  // Xử lý click nút play/pause danh sách
  const handlePlayList = () => {
    if (isPlayingList) {
      if (isPaused) {
        audioElement?.play().catch((err) => console.error("Audio play error:", err));
        setIsPaused(false);
      } else {
        audioElement?.pause();
        setIsPaused(true);
      }
    } else {
      stopCurrentAudio();
      setIsPlayingList(true);
      setCurrentAudioIndex(0);
      setShowAudioControls(true);
    }
  };

  // Xử lý click nút skip (next)
  const handleSkip = () => {
    if (isPlayingList) {
      if (currentAudioIndex < newsItems.length - 1) {
        stopCurrentAudio();
        setIsPlayingList(true);
        setCurrentAudioIndex(currentAudioIndex + 1);
      } else if (currentPage < totalPages) {
        stopCurrentAudio();
        setCurrentPage(currentPage + 1);
        setCurrentAudioIndex(0);
        setIsPlayingList(true);
      } else {
        stopCurrentAudio();
      }
    }
  };

  // Xử lý click nút previous
  const handlePrevious = () => {
    if (isPlayingList) {
      if (currentAudioIndex > 0) {
        stopCurrentAudio();
        setIsPlayingList(true);
        setCurrentAudioIndex(currentAudioIndex - 1);
      } else if (currentPage > 1) {
        stopCurrentAudio();
        setCurrentPage(currentPage - 1);
        setIsPlayingList(true);
        setTimeout(() => {
          setCurrentAudioIndex(newsItems.length - 1);
        }, 0);
      }
    }
  };

  // Xử lý click nút stop (X)
  const handleStop = () => {
    stopCurrentAudio();
    setShowAudioControls(false);
  };

  // Xử lý phát audio riêng lẻ
  const handlePlaySingleAudio = (articleId) => {
    const articleIndex = newsItems.findIndex((item) => item.id === articleId);
    if (articleIndex === -1 || !newsItems[articleIndex].audioUrl) return;

    if (singleAudioPlayingId === articleId) {
      stopCurrentAudio();
    } else {
      stopCurrentAudio();
      const audio = new Audio(newsItems[articleIndex].audioUrl);
      setAudioElement(audio);
      setSingleAudioPlayingId(articleId);
      audio.play().catch((err) => console.error("Audio play error:", err));

      audio.onended = () => {
        stopCurrentAudio();
      };
    }
  };

  // Xử lý favorite/unfavorite
  const handleFavoriteClick = async (articleId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const article = newsItems.find((item) => item.id === articleId);
      if (!article) return;

      const isFavorited = article.favorite;
      const url = isFavorited ? `/api/v1/articles/${articleId}/unfavorite` : `/api/v1/articles/${articleId}/favorite`;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          lang: "vi",
          Accept: "application/json",
        },
      };

      printCurlCommand(url, config, "POST");

      const response = await axios.post(url, {}, config);
      console.log("Favorite/Unfavorite API response:", response.data);

      setNewsItems((prevItems) =>
        prevItems.map((item) =>
          item.id === articleId ? { ...item, favorite: !isFavorited } : item
        )
      );
    } catch (error) {
      console.error("Favorite/Unfavorite error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
      setError(
        error.response?.data?.message || "Failed to update favorite status. Please try again."
      );
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    stopCurrentAudio();
  };

  const handleVolumeClick = () => {
    if (!isPlayingList && !showAudioControls) {
      stopCurrentAudio();
      setIsPlayingList(true);
      setCurrentAudioIndex(0);
      setShowAudioControls(true);
    } else if (isPlayingList) {
      handlePlayList();
    }
  };

  // Ưu tiên hiển thị "Favorites" nếu favorite=true
  const displayTitle = favorite ? "Favorites" : (searchQuery || topicTitle || "Tin mới");

  return (
    <div className="min-h-screen flex flex-col justify-start items-center py-6 px-4 md:px-6 bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center xl:max-w-5xl max-w-4xl w-full mb-4 gap-2">
        <div className="text-xl sm:text-2xl font-bold text-gray-800">
          {displayTitle}
        </div>
        <div className="flex gap-2">
          {!showAudioControls ? (
            <button onClick={handleVolumeClick}>
              <VolumeUpIcon className="text-blue-600" />
            </button>
          ) : (
            <>
              <button onClick={handlePrevious} disabled={currentAudioIndex === 0 && currentPage === 1}>
                <SkipPreviousIcon
                  className={`text-blue-600 ${currentAudioIndex === 0 && currentPage === 1 ? 'opacity-50' : ''}`}
                />
              </button>
              <button onClick={handlePlayList}>
                {isPlayingList && !isPaused ? (
                  <PauseIcon className="text-blue-600" />
                ) : (
                  <PlayArrowIcon className="text-blue-600" />
                )}
              </button>
              <button onClick={handleSkip}>
                <SkipNextIcon className="text-blue-600" />
              </button>
              <button onClick={handleStop}>
                <CloseIcon className="text-blue-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow max-w-4xl xl:max-w-5xl w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {newsItems.length > 0 ? (
          newsItems.map((item, idx) => (
            <div
              key={item.id || idx}
              ref={(el) => (newsItemRefs.current[idx] = el)}
              onClick={() => navigate(`/papers/${item.id}`)}
              className={`cursor-pointer ${currentAudioIndex === idx && isPlayingList ? 'border-2 border-red-500 rounded-lg' : ''}`}
            >
              <NewsCard
                {...item}
                favorite={item.favorite}
                onFavoriteClick={() => handleFavoriteClick(item.id)}
                audioUrl={item.audioUrl}
                isPlaying={singleAudioPlayingId === item.id}
                onPlayAudio={() => handlePlaySingleAudio(item.id)}
              />
            </div>
          ))
        ) : (
          <div className="text-center text-gray-600">No articles found.</div>
        )}
        <div className="flex justify-center pt-4">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </div>
      </div>
    </div>
  );
}

export default PaperList;