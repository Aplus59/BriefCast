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

// Removed fake topics as the backend doesn't support topics currently

export default function HomeContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Data variables ---
  const [latestNews, setLatestNews] = useState({ big: null, small: [] });
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(true);
        await fetchLatestNews();
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

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
      
      let articles = [];
      if (Array.isArray(data)) {
        articles = data;
      } else if (data && data.data && Array.isArray(data.data.data)) {
        articles = data.data.data;
      }

      if (articles.length > 0) {
        const bigNews = {
          id: articles[0].id || articles[0]._id || Math.random(),
          title: articles[0].title || 'Unknown Title',
          content: articles[0].summary ? [articles[0].summary] : ['No content available'],
          imgUrl: articles[0].image_url || articles[0].image || 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg',
          is_favorite: articles[0].is_favorite || false,
          audioUrl: articles[0].audio_url || (voice === "Giọng nam" ? 
            (articles[0].male_audio?.url || null) : 
            (articles[0].female_audio?.url || null)),
        };

        const smallNews = articles.slice(1, 5).map((article) => ({
          id: article.id || article._id || Math.random(),
          title: article.title || 'Unknown Title',
          imgUrl: article.image_url || article.image || 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg',
          is_favorite: article.is_favorite || false,
          audioUrl: article.audio_url || (voice === "Giọng nam" ? 
            (article.male_audio?.url || null) : 
            (article.female_audio?.url || null)),
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
    <div className="h-full w-full px-4 md:px-24 xl:px-40 2xl:px-60 pt-8">

      {/* Latest News Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Latest News</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                localStorage.setItem("topic_title", "Latest News");
                navigate(`/papers?type=latest`);
              }}
              className="text-sm bg-gray p-2 text-black rounded-lg"
            >
              View More
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
                  referrerPolicy="no-referrer"
                  src={latestNews.big.imgUrl}
                  alt={latestNews.big.title}
                  loading="lazy"
                  className="w-[32vh] h-[25vh] lg:w-[25vh] lg:h-[20vh] xl:w-[28vh] xl:h-[23vh] object-cover rounded"
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
                    referrerPolicy="no-referrer"
                    src={news.imgUrl}
                    alt={news.title}
                    loading="lazy"
                    className="w-full md:h-[20vh] lg:h-[18vh] xl:h-[23vh] rounded-lg object-cover"
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
          <div className="text-center text-gray-600">No news available.</div>
        )}
      </section>
    </div>
  );
}