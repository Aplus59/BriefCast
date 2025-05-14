import { IconButton, Card, CardContent, Link, Typography } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { SkeletonTopicCard, SkeletonNewsCard } from '../components/common/Skeleton';

const fakeTopics = [
  { id: 1, title: "Nông nghiệp", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
  { id: 2, title: "Chính phủ", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
  { id: 3, title: "Thể thao", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
  { id: 4, title: "Giáo dục", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
  { id: 5, title: "Khoa học", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
  { id: 6, title: "Y tế", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
  { id: 7, title: "Văn học", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
  { id: 8, title: "Toán", imgUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg" },
];

export default function HomeContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Data variables ---
  const [topics, setTopics] = useState(fakeTopics);
  const [latestNews, setLatestNews] = useState({ big: null, small: [] });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Thêm trạng thái loading
  const itemsPerPage = 4;

  // --- Audio states ---
  const [isPlayingList, setIsPlayingList] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [audioElement, setAudioElement] = useState(null);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [volume, setVolume] = useState(1); // Volume state (0 to 1)
  const newsItemRefs = useRef([]);

  // Lấy giá trị voice từ localStorage
  const voice = localStorage.getItem("voice") || "Giọng nam";

  useEffect(() => {
    console.log("Current location:", location);
  }, [location]);

  // --- Check user and fetch data ---
  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = {
          name: localStorage.getItem("username") || "",
          email: localStorage.getItem("email") || "",
          userId: localStorage.getItem("userId") || "",
        };

        if (!userData.userId) {
          navigate("/login");
        } else {
          setIsLoading(true); // Bắt đầu loading
          await Promise.all([fetchTopics(), fetchLatestNews()]);
          setIsLoading(false); // Kết thúc loading
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra người dùng:", error);
        setIsLoading(false);
        navigate("/login");
      }
    };

    checkUser();
  }, [navigate]);

  // --- Fetch topics ---
  const fetchTopics = async () => {
    try {
      const data = await fetchWithAuth("/topics/suggest");
      console.log('Topics API response:', data);

      if (data && Array.isArray(data.data)) {
        const formattedTopics = data.data.map((topic) => ({
          id: topic.id || Math.random(),
          title: topic.title || topic.name || "Unknown Topic",
          imgUrl: topic.imgUrl || topic.image || "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
        }));
        setTopics(formattedTopics);
      } else {
        console.warn('Dữ liệu API topics không hợp lệ, dùng dữ liệu giả.');
        setTopics(fakeTopics);
      }
    } catch (error) {
      console.error('Lỗi gọi API topics:', error);
      setTopics(fakeTopics);
    }
  };

  // --- Fetch latest news ---
  const fetchLatestNews = async () => {
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 5,
        sort_by: 'published_date',
        sort_order: 'desc',
        favorite: false,
      });

      const data = await fetchWithAuth(`/articles?${params.toString()}`);
      const articles = data.data.data;
      if (articles && Array.isArray(articles) && articles.length > 0) {
        const bigNews = {
          id: articles[0].id || Math.random(),
          title: articles[0].title || 'Unknown Title',
          content: articles[0].summary || ['No content available'],
          imgUrl: articles[0].image || 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg',
          is_favorite: articles[0].is_favorite || false,
          audioUrl: voice === "Giọng nam" ? 
            (articles[0].male_audio?.url || null) : 
            (articles[0].female_audio?.url || null),
        };

        const smallNews = articles.slice(1, 5).map((article) => ({
          id: article.id || Math.random(),
          title: article.title || 'Unknown Title',
          imgUrl: article.image || 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg',
          is_favorite: article.is_favorite || false,
          audioUrl: voice === "Giọng nam" ? 
            (article.male_audio?.url || null) : 
            (article.female_audio?.url || null),
        }));
        setLatestNews({
          big: bigNews,
          small: smallNews,
        });
      } else {
        console.warn('No valid articles found or empty array:', articles);
        setLatestNews({ big: null, small: [] });
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setLatestNews({ big: null, small: [] });
    }
  };

  // --- Handlers ---
  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if ((currentPage + 1) * itemsPerPage < topics.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // --- Handle topic click ---
  const handleTopicClick = async (topicId) => {
    try {
      const selectedTopic = topics.find((topic) => topic.id === topicId);
      if (selectedTopic) {
        localStorage.setItem("topic_title", selectedTopic.title);
        navigate(`/papers?topic_id=${topicId}`);
      } else {
        console.warn("Topic not found for id:", topicId);
        navigate("/papers");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý click chủ đề:", error);
      navigate("/login");
    }
  };

  // --- Calculate displayed topics ---
  const displayedTopics = topics.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // --- Audio handlers ---
  const stopCurrentAudio = (resetControls = true) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
      setAudioElement(null);
    }
    setIsPlayingList(false);
    setIsPaused(false);
    setCurrentAudioIndex(-1);
    if (resetControls) {
      setShowAudioControls(false);
    }
  };

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
      stopCurrentAudio(false);
      if (latestNews.big?.audioUrl) {
        setIsPlayingList(true);
        setCurrentAudioIndex(0);
        setShowAudioControls(true);
      } else {
        console.warn("No audio available for the first article.");
      }
    }
  };

  const handleSkip = () => {
    if (isPlayingList) {
      const totalItems = (latestNews.big ? 1 : 0) + latestNews.small.length;
      if (currentAudioIndex < totalItems - 1) {
        stopCurrentAudio(false);
        setIsPlayingList(true);
        setCurrentAudioIndex(currentAudioIndex + 1);
      } else {
        stopCurrentAudio(true);
      }
    }
  };

  const handlePrevious = () => {
    if (isPlayingList && currentAudioIndex > 0) {
      stopCurrentAudio(false);
      setIsPlayingList(true);
      setCurrentAudioIndex(currentAudioIndex - 1);
    }
  };

  const handleStop = () => {
    stopCurrentAudio(true);
  };

  const handleVolumeChange = (event) => {
    const newVolume = event.target.value;
    setVolume(newVolume);
    if (audioElement) {
      audioElement.volume = newVolume; // Cập nhật volume trực tiếp
    }
  };

  // --- Audio playback logic ---
  useEffect(() => {
    if (isPlayingList && !isPaused && currentAudioIndex >= 0) {
      const allNews = latestNews.big ? [latestNews.big, ...latestNews.small] : latestNews.small;
      if (currentAudioIndex >= allNews.length || !allNews[currentAudioIndex].audioUrl) {
        stopCurrentAudio(true);
        return;
      }

      const audioUrl = allNews[currentAudioIndex].audioUrl;
      const audio = new Audio(audioUrl);
      audio.volume = volume; // Set initial volume
      setAudioElement(audio);

      audio.play().catch((err) => console.error("Audio play error:", err));

      audio.onended = () => {
        if (currentAudioIndex < allNews.length - 1) {
          setCurrentAudioIndex(currentAudioIndex + 1);
        } else {
          stopCurrentAudio(true);
        }
      };

      return () => {
        audio.pause();
        audio.src = "";
      };
    }
  }, [currentAudioIndex, isPlayingList, isPaused, latestNews]); // Loại bỏ volume khỏi dependencies

  // --- Scroll to currently playing article ---
  useEffect(() => {
    if (isPlayingList && currentAudioIndex >= 0) {
      const currentItemRef = newsItemRefs.current[currentAudioIndex];
      if (currentItemRef) {
        currentItemRef.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [currentAudioIndex, isPlayingList]);

  // --- Check if current article is the last one ---
  const isLastItem = () => {
    const totalItems = (latestNews.big ? 1 : 0) + latestNews.small.length;
    return currentAudioIndex >= totalItems - 1;
  };

  return (
    <div className="h-full w-full px-4 md:px-24 xl:px-40 2xl:px-60">
      {/* Topics Section */}
      <section className="mb-8 h-full">
        <div className="flex justify-between items-center mt-8 mb-4">
          <h2 className="text-2xl font-bold">Chủ đề cho bạn</h2>
          <div className="space-x-2">
            <IconButton size="small" onClick={handlePrev} disabled={currentPage === 0}>
              <ArrowBackIos fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNext}
              disabled={(currentPage + 1) * itemsPerPage >= topics.length}
            >
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6 px-2 sm:px-4 md:px-6 lg:px-10 rounded-lg shadow">
          {isLoading ? (
            Array(4).fill().map((_, idx) => (
              <SkeletonTopicCard key={idx} />
            ))
          ) : (
            displayedTopics.map((topic) => (
              <div
                key={topic.id}
                className="flex flex-col justify-between items-center py-6 rounded-md bg-gray cursor-pointer"
                onClick={() => handleTopicClick(topic.id)}
              >
                <span className="text-lg font-bold text-center mb-4">{topic.title}</span>
                <div className="lg:h-[15vh] lg:w-[20vh] xl:h-[18vh] xl:w-[23vh] md:h-[15vh] md:w-[20vh] ">
                  <img
                    src={topic.imgUrl}
                    alt={topic.title}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Latest News Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tin mới</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                localStorage.setItem("topic_title", "Tin mới");
                navigate(`/papers?type=latest`);
              }}
              className="text-sm bg-gray p-2 text-black rounded-lg"
            >
              Xem thêm
            </button>
            {!showAudioControls ? (
              <button onClick={handlePlayList}>
                <VolumeUpIcon className="text-blue-600" />
              </button>
            ) : (
              <>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24"
                />
                <button
                  onClick={handlePrevious}
                  disabled={currentAudioIndex === 0}
                >
                  <SkipPreviousIcon
                    className={`text-blue-600 ${currentAudioIndex === 0 ? 'opacity-50' : ''}`}
                  />
                </button>
                <button onClick={handlePlayList}>
                  {isPlayingList && !isPaused ? (
                    <PauseIcon className="text-blue-600" />
                  ) : (
                    <PlayArrowIcon className="text-blue-600" />
                  )}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={isLastItem()}
                >
                  <SkipNextIcon
                    className={`text-blue-600 ${isLastItem() ? 'opacity-50' : ''}`}
                  />
                </button>
                <button onClick={handleStop}>
                  <CloseIcon className="text-blue-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col rounded-lg shadow py-3 h-full lg:p-4 bg-gray">
            {/* Big News Skeleton */}
            <SkeletonNewsCard isBig={true} />
            {/* Small News Skeleton */}
            <div className="grid grid-cols-1 mt-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 h-auto">
              {Array(4).fill().map((_, idx) => (
                <SkeletonNewsCard key={idx} isBig={false} />
              ))}
            </div>
          </div>
        ) : latestNews.big ? (
          <div className="flex flex-col rounded-lg shadow py-3 h-full lg:p-4 bg-gray">
            {/* Big News */}
            <div
              ref={(el) => (newsItemRefs.current[0] = el)}
              className={`flex items-center gap-4 big-new rounded-lg ${
                currentAudioIndex === 0 && isPlayingList ? 'border-2 border-red-500' : ''
              }`}
              onClick={() => navigate(`/papers/${latestNews.big.id}`)}
            >
              <Card className="flex items-center gap-4 w-full p-4">
                <img
                  src={latestNews.big.imgUrl}
                  alt={latestNews.big.title}
                  loading="lazy"
                  className="w-[32vh] h-[25vh] lg:w-[25vh] lg:h-[20vh] object-cover rounded"
                />
                <CardContent className="p-0 w-full">
                  <Typography variant="h6" className="font-semibold mb-2">
                    {latestNews.big.title}
                  </Typography>
                  <ul className="list-disc pl-5 text-gray-600">
                    {latestNews.big.content.map((item, index) => (
                      <li key={index}>
                        <Typography variant="body2">{item}</Typography>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            {/* Small News */}
            <div className="grid grid-cols-1 mt-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 h-auto">
              {latestNews.small.map((news, index) => (
                <div
                  key={news.id}
                  ref={(el) => (newsItemRefs.current[index + 1] = el)}
                  className={`bg-white rounded-lg shadow flex flex-col ${
                    currentAudioIndex === index + 1 && isPlayingList ? 'border-2 border-red-500' : ''
                  }`}
                  onClick={() => navigate(`/papers/${news.id}`)}
                >
                  <img
                    src={news.imgUrl}
                    alt={news.title}
                    loading="lazy"
                    className="w-full md:h-[20vh] lg:h-[18vh] rounded-lg object-cover"
                  />
                  <div className="p-2">
                    <h4 className="text-md font-semibold">{news.title}</h4>
                    {news.is_favorite && <FavoriteBorderIcon color="error" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">Không có tin tức mới.</div>
        )}
      </section>
    </div>
  );
}