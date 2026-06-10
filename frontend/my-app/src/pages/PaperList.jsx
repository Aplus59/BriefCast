import { useState, useEffect, useRef } from "react";
import NewsCard from "../components/common/NewsCard";
import { Pagination, TextField, Autocomplete, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
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

// Skeleton cho NewsCard
const SkeletonNewsCard = () => (
  <div className="bg-white rounded-xl shadow p-4 animate-pulse">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-40 h-40 bg-gray-300 rounded"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="h-4 bg-gray-300 rounded w-24"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    </div>
  </div>
);

function PaperList() {
  const navigate = useNavigate();
  const itemsPerPage = 6;
  const [newsItems, setNewsItems] = useState(defaultNewsItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPlayingList, setIsPlayingList] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [singleAudioPlayingId, setSingleAudioPlayingId] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Thêm trạng thái loading
  const query = useQuery();
  const search = query.get("search");
  const topicId = query.get("topic_id");
  const type = query.get("type");
  const fromDate = query.get("from");
  const toDate = query.get("to");
  const sortOrder = query.get("sort") === "newest" ? "desc" : "asc";
  const topicTitle = localStorage.getItem("topic_title") || "";
  const newsItemRefs = useRef([]);
  const [scrollMode, setScrollMode] = useState(
    localStorage.getItem("scrollMode") || "autoscroll"
  );
  const voice = localStorage.getItem("voice") || "Giọng nam";
  const language = localStorage.getItem("language") || "en";
  const [volume, setVolume] = useState(1);
  const topicParam = query.get("topic");
  const selectedTopics = topicParam ? topicParam.split(",") : [];

  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        console.log("Fetching topics for lang:", language);
        const response = await fetchWithAuth(`/topics?lang=${language}`);
        console.log("Topics response:", response);
        if (Array.isArray(response)) {
          const decoded = response.map((t) => {
            try {
              return decodeURIComponent(t);
            } catch (e) {
              return t;
            }
          });
          setTopics(decoded);
        } else {
          const TOPICS_EN = ["World", "Politics", "Technology", "Science", "Health", "Business", "Sports", "Entertainment"];
          const TOPICS_FR = ["Monde", "Politique", "Technologie", "Sciences", "Santé", "Economie", "Sports", "Culture"];
          setTopics(language === "fr" ? TOPICS_FR : TOPICS_EN);
        }
      } catch (error) {
        console.error("Failed to fetch topics:", error);
        const TOPICS_EN = ["World", "Politics", "Technology", "Science", "Health", "Business", "Sports", "Entertainment"];
        const TOPICS_FR = ["Monde", "Politique", "Technologie", "Sciences", "Santé", "Economie", "Sports", "Culture"];
        setTopics(language === "fr" ? TOPICS_FR : TOPICS_EN);
      }
    };
    fetchTopics();
  }, [language]);

  const handleScrollModeToggle = () => {
    const newMode = scrollMode === "autoscroll" ? "noscroll" : "autoscroll";
    setScrollMode(newMode);
    localStorage.setItem("scrollMode", newMode);
  };

  const handleVolumeChange = (event) => {
    const newVolume = event.target.value;
    setVolume(newVolume);
    if (audioElement) {
      audioElement.volume = newVolume; // Cập nhật volume trực tiếp
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
      setIsLoading(true); // Bắt đầu loading
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      params.append("sort_by", "published_date");
      params.append("sort_order", sortOrder);
      params.append("page", page);
      params.append("limit", itemsPerPage);
      params.append("lang", language);
      if (topicParam) params.append("topic", topicParam);
      if (topicId && topicId !== "latest") {
        params.append("topic_ids[]", topicId);
      }
      console.log("Fetching articles with endpoint:", `/api/v1/articles?${params.toString()}`);
      const response = await fetchWithAuth(`/articles?${params.toString()}`);
      console.log("API response:", response);

      let dataArray = [];
      if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        dataArray = response.data.data;
      } else if (response && Array.isArray(response.data)) {
        dataArray = response.data;
      }

      if (dataArray.length > 0) {
        const formattedItems = dataArray.map((item) => {
          const audioUrl =
            item.audio_url || (voice === "Giọng nam"
              ? item.male_audio?.url || null
              : item.female_audio?.url || null);

          let topicVal = (typeof item.topic === 'object' ? item.topic?.name : item.topic) || "General";
          try {
            topicVal = decodeURIComponent(topicVal);
          } catch (e) {}
          if (topicVal.toLowerCase() === "vidéo" || topicVal.toLowerCase() === "video") {
            topicVal = "video";
          }

          return {
            id: item.id || item._id || `fallback-${Math.random()}`,
            title: item.title || "Untitled",
            content: item.summary 
              ? item.summary.split('\n').map(s => s.replace(/^[-*•\s]+/, '').trim()).filter(s => s.length > 0)
              : ["No summary available"],
            imageUrl:
              item.image_url || item.image ||
              "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
            linkPaper: item.url || "#",
            datetime: item.published_at || item.published_date || "N/A",
            source: item.source?.name || item.source || "Unknown",
            topic: topicVal,
            topicId: item.topic?.id || null,
            reliabilityScore: item.reliability_score || 0,
            audioUrl,
          };
        });
        setNewsItems(formattedItems);
        setTotalPages(response.meta?.total_pages || response.data?.meta?.total_pages || 1);
      } else {
        console.warn("Invalid API response, no data available.");
        console.log(language === "fr" ? "Aucune donnée disponible depuis le serveur." : "Invalid API response, no data available.");
        setNewsItems([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("API error:", error);
      setNewsItems([]);
      setTotalPages(1);
      console.log(language === "fr" ? "Impossible de charger les articles. Veuillez réessayer plus tard." : "Unable to load articles. Please try again later.");

    } finally {
      setIsLoading(false); // Kết thúc loading
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
    sortOrder,
    currentPage,
    topicParam,
    navigate,
  ]);

  const handleTopicsChange = (event, newValue) => {
    const newParams = new URLSearchParams(window.location.search);
    if (newValue && newValue.length > 0) {
      newParams.set("topic", newValue.join(","));
    } else {
      newParams.delete("topic");
    }
    navigate(`/papers?${newParams.toString()}`);
    setCurrentPage(1);
    stopCurrentAudio();
  };

  const handleSortChange = (event) => {
    const newParams = new URLSearchParams(window.location.search);
    newParams.set("sort", event.target.value);
    navigate(`/papers?${newParams.toString()}`);
    setCurrentPage(1);
  };

  const handleDateChange = (type, value) => {
    const newParams = new URLSearchParams(window.location.search);
    if (value) {
      newParams.set(type, value);
    } else {
      newParams.delete(type);
    }
    navigate(`/papers?${newParams.toString()}`);
  };

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
        console.log(language === "fr" ? "Cet article n'a pas d'audio." : "This article has no audio.");

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
      console.log(language === "fr" ? "Cet article n'a pas d'audio." : "This article has no audio.");

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
        console.log(language === "fr" ? "Cet article n'a pas d'audio." : "This article has no audio.");
      }
    } else if (isPlayingList) {
      handlePlayList();
    }
  };

  const displayTitle = search || (topicId && topicTitle) || (type && (language === "fr" ? "Nouvelles" : "Latest News"));
  console.log("topic id", topicId, "searchQuery", search, "Tin", type);

  return (
    <div className="min-h-screen flex flex-col justify-start items-center py-8 px-4 md:px-6 bg-gray-50">
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
              className="rounded-t-xl bg-white border-2  px-10"
            >
              <PlayArrowIcon
                sx={{ height: "40px", width: "40px" }}
                className="text-black"
              />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col max-w-5xl xl:max-w-7xl 2xl:max-w-[1600px] w-full mb-4 gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-xl sm:text-2xl font-bold text-gray-800">
            {displayTitle}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {language === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
          </div>
        </div>

        {/* Topic Multi-Select */}
        <div className="w-full">
          <Autocomplete
            multiple
            id="topic-select"
            options={topics}
            value={selectedTopics}
            onChange={handleTopicsChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={language === "fr" ? "Sujets" : "Topics"}
                placeholder={language === "fr" ? "Rechercher des sujets..." : "Search topics..."}
                size="small"
              />
            )}
            className="bg-white"
          />
        </div>
        
        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 items-center mt-2">
          <TextField
            label={language === "fr" ? "Du" : "From"}
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fromDate || ""}
            onChange={(e) => handleDateChange("from", e.target.value)}
            sx={{ width: 150 }}
          />
          <TextField
            label={language === "fr" ? "Au" : "To"}
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={toDate || ""}
            onChange={(e) => handleDateChange("to", e.target.value)}
            sx={{ width: 150 }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow max-w-5xl xl:max-w-7xl 2xl:max-w-[1600px] w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 min-[1440px]:grid-cols-2 gap-6 w-full">
          {isLoading ? (
            Array(5).fill().map((_, idx) => (
              <SkeletonNewsCard key={idx} />
            ))
          ) : newsItems.length > 0 ? (
            newsItems.map((item, idx) => (
              <div
                key={item.id || idx}
                ref={(el) => (newsItemRefs.current[idx] = el)}
                className={`${
                  currentAudioIndex === idx && isPlayingList
                    ? "border-2 border-red-500 rounded-lg"
                    : ""
                }`}
              >
                <NewsCard
                  {...item}
                  audioUrl={item.audioUrl}
                  isPlaying={singleAudioPlayingId === item.id}
                  onPlayAudio={() => handlePlaySingleAudio(item.id)}
                />
              </div>
            ))
          ) : (
            <div className="col-span-1 xl:col-span-2 text-center text-gray-600 font-medium py-8">
              {language === "fr" ? "Aucun article trouvé." : "No articles found."}
            </div>
          )}
        </div>
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