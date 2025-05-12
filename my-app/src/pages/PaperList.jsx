import { useState, useEffect, useRef } from "react";
import NewsCard from "../components/common/NewsCard";
import { Pagination } from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VerticalAlignTopIcon from "@mui/icons-material/VerticalAlignTop";
import SwipeVerticalIcon from "@mui/icons-material/SwipeVertical";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
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
    imageUrl:
      "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
    linkPaper:
      "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
    datetime: "21/4/2025",
    id: "default-1",
    favorite: false,
    audioUrl: null,
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
  const type = query.get("type");
  const fromDate = query.get("from");
  const toDate = query.get("to");
  const favorite = query.get("favorite") === "true";
  const sortOrder = query.get("sort") === "newest" ? "desc" : "asc";
  const topicTitle = localStorage.getItem("topic_title") || "";
  const newsItemRefs = useRef([]);
  const [scrollMode, setScrollMode] = useState(
    localStorage.getItem("scrollMode") || "autoscroll"
  );
  const voice = localStorage.getItem("voice") || "Giọng nam";
  const [volume, setVolume] = useState(1);

  const handleScrollModeToggle = () => {
    const newMode = scrollMode === "autoscroll" ? "noscroll" : "autoscroll";
    setScrollMode(newMode);
    localStorage.setItem("scrollMode", newMode);
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioElement) {
      audioElement.volume = newVolume;
    }
  };

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

  const fetchNews = async (page) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // Construct query parameters, excluding undefined or null values
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);
    params.append("sort_by", "published_date");
    params.append("sort_order", sortOrder);
    params.append("page", page);
    params.append("limit", itemsPerPage);
    // Handle topic_ids as an array
    if (topicId && topicId !== "latest") {
      params.append("topic_ids[]", topicId);
    }

    console.log(
      "Fetching articles with endpoint:",
      `/api/v1/articles?${params.toString()}`
    );
    const response = await fetchWithAuth(`/articles?${params.toString()}`, {
      headers: { lang: "vi" },
    });
    console.log("API response:", response);

    if (response.data && Array.isArray(response.data.data)) {
      if (response.data.data.length === 0) {
        setNewsItems([]);
        setTotalPages(1);
        setError(
          favorite
            ? "Không tìm thấy bài viết yêu thích nào."
            : `Không tìm thấy bài viết nào cho chủ đề "${topicTitle}".`
        );
        return;
      }

      const formattedItems = response.data.data.map((item) => {
        const audioUrl =
          voice === "Giọng nam"
            ? item.male_audio?.url || null
            : item.female_audio?.url || null;

        return {
          id: item.id || `fallback-${Math.random()}`,
          title: item.title || "Untitled",
          content: item.summary || ["No summary available"],
          imageUrl:
            item.image ||
            "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
          linkPaper: item.url || "#",
          datetime: item.published_date || "N/A",
          source: item.source?.name || "Unknown",
          topic: item.topic?.name || "General",
          topicId: item.topic?.id || null,
          favorite: item.is_favorite || false,
          audioUrl,
        };
      });
      setNewsItems(formattedItems);
      setTotalPages(response.data.meta?.total_pages || 1);
      setError(null);
    } else {
      console.warn("Invalid API response, no data available.");
      setNewsItems([]);
      setTotalPages(1);
      setError("Dữ liệu từ server không hợp lệ.");
    }
  } catch (error) {
    console.error("API error:", error);
    setNewsItems([]);
    setTotalPages(1);
    setError(
      error.message || "Không thể tải bài viết. Vui lòng thử lại sau."
    );
  }
};

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
      const url = isFavorited
        ? `/articles/${articleId}/unfavorite`
        : `/articles/${articleId}/favorite`;

      console.log(`Sending favorite/unfavorite request to: ${url}`);
      const response = await fetchWithAuth(url, {
        method: "POST",
        headers: { lang: "vi" },
      });
      console.log("Favorite/Unfavorite API response:", response);

      setNewsItems((prevItems) =>
        prevItems.map((item) =>
          item.id === articleId ? { ...item, favorite: !isFavorited } : item
        )
      );
    } catch (error) {
      console.error("Favorite/Unfavorite error:", error);
      setError(
        error.message || "Failed to update favorite status. Please try again."
      );
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchNews(currentPage);
  }, [
    search,
    topicId,
    fromDate,
    toDate,
    favorite,
    sortOrder,
    currentPage,
    navigate,
  ]);

  useEffect(() => {
    if (
      isPlayingList &&
      currentAudioIndex >= 0 &&
      currentAudioIndex < newsItems.length &&
      scrollMode === "autoscroll"
    ) {
      const currentItemRef = newsItemRefs.current[currentAudioIndex];
      if (currentItemRef) {
        currentItemRef.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [currentAudioIndex, isPlayingList, newsItems, scrollMode]);

  useEffect(() => {
    if (
      isPlayingList &&
      !isPaused &&
      currentAudioIndex >= 0 &&
      currentAudioIndex < newsItems.length
    ) {
      const audioUrl = newsItems[currentAudioIndex].audioUrl;
      if (!audioUrl) {
        if (currentAudioIndex < newsItems.length - 1) {
          setCurrentAudioIndex(currentAudioIndex + 1);
        } else if (currentPage < totalPages) {
          setCurrentPage(currentPage + 1);
          setCurrentAudioIndex(0);
          setIsPlayingList(true);
        } else {
          stopCurrentAudio();
        }
        return;
      }

      const audio = new Audio(audioUrl);
      audio.volume = volume;
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
  }, [
    currentAudioIndex,
    isPlayingList,
    isPaused,
    newsItems,
    currentPage,
    totalPages,
    volume,
  ]);

  const handlePlayList = () => {
    if (isPlayingList) {
      if (isPaused) {
        audioElement
          ?.play()
          .catch((err) => console.error("Audio play error:", err));
        setIsPaused(false);
      } else {
        audioElement?.pause();
        setIsPaused(true);
      }
    } else {
      stopCurrentAudio();
      if (newsItems[0]?.audioUrl) {
        setIsPlayingList(true);
        setCurrentAudioIndex(0);
        setShowAudioControls(true);
      } else {
        setError("Bài viết này không có audio.");
      }
    }
  };

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

  const handleStop = () => {
    stopCurrentAudio();
    setShowAudioControls(false);
  };

  const handlePlaySingleAudio = (articleId) => {
    const articleIndex = newsItems.findIndex((item) => item.id === articleId);
    if (articleIndex === -1 || !newsItems[articleIndex].audioUrl) {
      setError("Bài viết này không có audio.");
      return;
    }

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

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    stopCurrentAudio();
  };

  const handleVolumeClick = () => {
    if (!isPlayingList && !showAudioControls) {
      stopCurrentAudio();
      if (newsItems[0]?.audioUrl) {
        setIsPlayingList(true);
        setCurrentAudioIndex(0);
        setShowAudioControls(true);
      } else {
        setError("Bài viết này không có audio.");
      }
    } else if (isPlayingList) {
      handlePlayList();
    }
  };

  const displayTitle = favorite
    ? "Favorites"
    : search || (topicId && topicTitle) || (type && "Tin mới");
  console.log("topic id", topicId, "searchQuery", search, "Tin", type);

  return (
    <div className="min-h-screen flex flex-col justify-start items-center py-6 px-4 md:px-6 bg-gray-50">
      <div className="flex gap-2 fixed bottom-0 justify-center w-full z-50">
        {showAudioControls ? (
          <div className="flex justify-center opacity-80 rounded-t-xl bg-white border-2 py-4 pl-7 pr-10">
            <div className="flex items-center mr-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 accent-blue-500"
              />
            </div>
            <button
              onClick={handlePrevious}
              disabled={currentAudioIndex === 0 && currentPage === 1}
            >
              <SkipPreviousIcon
                sx={{ height: "40px", width: "40px" }}
                className={`text-black ${
                  currentAudioIndex === 0 && currentPage === 1
                    ? "opacity-50"
                    : ""
                }`}
              />
            </button>
            <button onClick={handlePlayList}>
              {isPlayingList && !isPaused ? (
                <PauseIcon
                  sx={{ height: "40px", width: "40px" }}
                  className="text-black"
                />
              ) : (
                <PlayArrowIcon
                  sx={{ height: "40px", width: "40px" }}
                  className="text-black"
                />
              )}
            </button>
            <button onClick={handleSkip}>
              <SkipNextIcon
                sx={{ height: "40px", width: "40px" }}
                className="text-black"
              />
            </button>
            <button onClick={handleScrollModeToggle}>
              {scrollMode === "autoscroll" ? (
                <VerticalAlignTopIcon
                  sx={{ height: "30px", width: "30px" }}
                  className="text-black ml-4"
                />
              ) : (
                <SwipeVerticalIcon
                  sx={{ height: "30px", width: "30px" }}
                  className="text-black ml-4"
                />
              )}
            </button>
            <button onClick={handleStop}>
              <CloseIcon
                sx={{ height: "40px", width: "40px" }}
                className="text-black ml-2"
              />
            </button>
          </div>
        ) : (
          <div className="w-full flex justify-center opacity-80">
            <button
              onClick={handleVolumeClick}
              className="rounded-t-xl bg-white border-2 py-4 px-12"
            >
              <PlayArrowIcon
                sx={{ height: "40px", width: "40px" }}
                className="text-black"
              />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center xl:max-w-5xl max-w-4xl w-full mb-4 gap-2">
        <div className="text-xl sm:text-2xl font-bold text-gray-800">
          {displayTitle}
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
              className={`cursor-pointer ${
                currentAudioIndex === idx && isPlayingList
                  ? "border-2 border-red-500 rounded-lg"
                  : ""
              }`}
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
