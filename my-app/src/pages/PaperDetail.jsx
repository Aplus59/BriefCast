import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import CloseIcon from "@mui/icons-material/Close";

const defaultArticle = {
  title: "Bộ Y tế công bố 21 loại thuốc giả",
  content: [
    "Bộ Y tế công bố 21 loại thuốc giả, gồm 4 thuốc tân dược giả mạo (Tetracycline, Clorocid, Pharcoter, Neo-Codon) va 17 sản phẩm chưa được cấp phép.",
    "Các thuốc này do đường dây sản xuất giả quy mô lớn thực hiện, đã bị triệt phá.",
    "Bộ yêu cầu ngừng sử dụng ngay lập tức, cảnh báo nguồn gốc rõ ràng, tránh các biến chứng nguy hiểm khi mua thuốc không rõ xuất xứ.",
  ],
  imageUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
  linkPaper: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
  datetime: "21/4/2025",
  source: "vnexpress",
  topicId: null,
  audioUrl: null,
};

const defaultRelatedArticles = [
  {
    title: "Bộ Y tế công bố 21 loại thuốc giả",
    content: [
      "Bộ Y tế công bố 21 loại thuốc giả, gồm 4 thuốc tân dược giả mạo.",
      "Các thuốc này do đường dây sản xuất giả quy mô lớn thực hiện.",
    ],
    imageUrl: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
    id: "default-1",
    audioUrl: null,
  },
];

const formatDate = (datetime) => {
  const date = new Date(datetime);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Skeleton cho Featured Article
const SkeletonArticle = () => (
  <div className="bg-blue-900 text-white rounded-xl shadow p-6 w-full lg:max-w-4xl xl:max-w-6xl mb-8 animate-pulse">
    <div className="flex flex-col md:flex-row md:space-x-6">
      <div className="w-full md:w-40 h-40 bg-gray-300 rounded mb-4 md:mb-0"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
        <ul className="list-disc pl-5 space-y-2">
          <li><div className="h-4 bg-gray-300 rounded w-full"></div></li>
          <li><div className="h-4 bg-gray-300 rounded w-5/6"></div></li>
          <li><div className="h-4 bg-gray-300 rounded w-3/4"></div></li>
        </ul>
        <div className="flex flex-wrap items-center mt-4">
          <div className="h-4 bg-gray-300 rounded w-24 ml-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-20 ml-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32 mt-2 md:mt-0 ml-2"></div>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton cho Related Article
const SkeletonRelatedArticle = () => (
  <div className="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-pulse">
    <div className="w-full sm:w-24 h-24 bg-gray-300 rounded"></div>
    <div>
      <div className="h-5 bg-gray-300 rounded w-3/4 mb-1"></div>
      <ul className="list-disc pl-5 space-y-2">
        <li><div className="h-4 bg-gray-300 rounded w-full"></div></li>
        <li><div className="h-4 bg-gray-300 rounded w-5/6"></div></li>
      </ul>
    </div>
  </div>
);

function PaperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(defaultArticle);
  const [relatedArticles, setRelatedArticles] = useState(defaultRelatedArticles);
  const [isLoading, setIsLoading] = useState(true);
  // Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [audioElement, setAudioElement] = useState(null);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [volume, setVolume] = useState(1); // Volume state (0 to 1)
  const newsItemRefs = useRef([]);

  const voice = localStorage.getItem("voice") || "Giọng nam";

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching article with endpoint:", `/api/v1/articles/${id}`);
        const response = await fetchWithAuth(`/articles/${id}`);
        console.log("Article API response:", response.data);

        if (response.data) {
          const item = response.data;
          const formattedArticle = {
            id: item.id || id,
            title: item.title || "Untitled",
            content: item.summary || ["No content available"],
            imageUrl:
              item.image ||
              "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
            linkPaper: item.url || "#",
            datetime: item.published_date || "N/A",
            source: item.source?.name || "Unknown",
            topicId: item.topic?.id || null,
            audioUrl: voice === "Giọng nam" ? 
              (item.male_audio?.url || null) : 
              (item.female_audio?.url || null),
          };
          setArticle(formattedArticle);

          console.log("Fetching related articles with endpoint:", `/api/v1/articles/${id}/related`);
          const relatedResponse = await fetchWithAuth(`/articles/${id}/related`);
          console.log("Related articles API response:", relatedResponse.data);

          if (relatedResponse.data && Array.isArray(relatedResponse.data)) {
            const formattedRelated = relatedResponse.data
              .filter((relatedItem) => relatedItem.id !== id)
              .map((relatedItem) => ({
                id: relatedItem.id || `related-${Math.random()}`,
                title: relatedItem.title || "Untitled",
                content: relatedItem.summary || ["No summary available"],
                imageUrl:
                  relatedItem.image ||
                  "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
                audioUrl: voice === "Giọng nam" ? 
                  (relatedItem.male_audio?.url || null) : 
                  (relatedItem.female_audio?.url || null),
              }));
            setRelatedArticles(formattedRelated);
          } else {
            console.warn("Invalid related articles API response, using default data.");
            setRelatedArticles(defaultRelatedArticles);
          }
        } else {
          console.warn("Invalid article API response, using default data.");
          setArticle(defaultArticle);
          setRelatedArticles(defaultRelatedArticles);
        }
      } catch (error) {
        console.error("API error:", error);
        setArticle(defaultArticle);
        setRelatedArticles(defaultRelatedArticles);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate, voice]);

  // Audio handlers
  const stopCurrentAudio = (resetControls = true) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
      setAudioElement(null);
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentAudioIndex(-1);
    if (resetControls) {
      setShowAudioControls(false);
    }
  };

  const handlePlay = () => {
    if (isPlaying) {
      if (isPaused) {
        audioElement?.play().catch((err) => console.error("Audio play error:", err));
        setIsPaused(false);
      } else {
        audioElement?.pause();
        setIsPaused(true);
      }
    } else {
      stopCurrentAudio(false);
      if (article.audioUrl) {
        setIsPlaying(true);
        setCurrentAudioIndex(0);
        setShowAudioControls(true);
      } else {
        console.warn("No audio available for the article.");
      }
    }
  };

  const handleSkip = () => {
    if (isPlaying) {
      const totalItems = 1 + relatedArticles.length;
      if (currentAudioIndex < totalItems - 1) {
        stopCurrentAudio(false);
        setIsPlaying(true);
        setCurrentAudioIndex(currentAudioIndex + 1);
      } else {
        stopCurrentAudio(true);
      }
    }
  };

  const handlePrevious = () => {
    if (isPlaying && currentAudioIndex > 0) {
      stopCurrentAudio(false);
      setIsPlaying(true);
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

  // Audio playback logic
  useEffect(() => {
    if (isPlaying && !isPaused && currentAudioIndex >= 0) {
      const allNews = [article, ...relatedArticles];
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
  }, [currentAudioIndex, isPlaying, isPaused, article, relatedArticles]); // Loại bỏ volume khỏi dependencies

  // Check if current article is the last one
  const isLastItem = () => {
    const totalItems = 1 + relatedArticles.length;
    return currentAudioIndex >= totalItems - 1;
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-gray-100 px-4 md:px-20">
      {/* Header */}
      <div className="flex justify-between items-center w-full lg:max-w-4xl xl:max-w-6xl mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Tin tức</h1>
        <div className="flex items-center space-x-2">
          {!showAudioControls ? (
            <button onClick={handlePlay}>
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
              <button onClick={handlePlay}>
                {isPlaying && !isPaused ? (
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

      {/* Featured Article */}
      {isLoading ? (
        <SkeletonArticle />
      ) : (
        <div
          ref={(el) => (newsItemRefs.current[0] = el)}
          className={`bg-blue-900 text-white rounded-xl shadow p-6 w-full lg:max-w-4xl xl:max-w-6xl mb-8 ${
            currentAudioIndex === 0 && isPlaying ? 'border-2 border-red-500' : ''
          }`}
        >
          <div className="flex flex-colpv md:flex-row md:space-x-6">
            <img
              loading="lazy"
              src={article.imageUrl}
              alt={article.title}
              className="w-full md:w-40 h-40 object-cover rounded mb-4 md:mb-0"
            />
            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-bold mb-2">{article.title}</h2>
              <ul className="list-disc pl-5 text-gray-200 text-sm md:text-base mb-1">
                {article.content.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center mt-4 text-sm md:text-base">
                <span className="ml-auto">Nguồn: {article.source}</span>
                <a
                  href={article.linkPaper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline ml-4"
                >
                  Link bài báo
                </a>
                <span className="mt-2 md:mt-0 ml-2">Ngày xuất bản: {formatDate(article.datetime)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Articles */}
      <div className="w-full lg:max-w-4xl xl:max-w-6xl">
        <h3 className="text-xl font-semibold mb-4">Bài báo liên quan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            Array(2).fill().map((_, idx) => (
              <SkeletonRelatedArticle key={idx} />
            ))
          ) : relatedArticles.length > 0 ? (
            relatedArticles.map((item, idx) => (
              <div
                key={item.id || idx}
                ref={(el) => (newsItemRefs.current[idx + 1] = el)}
                className={`bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 cursor-pointer ${
                  currentAudioIndex === idx + 1 && isPlaying ? 'border-2 border-red-500' : ''
                }`}
                onClick={() => navigate(`/papers/${item.id}`)}
              >
                <img
                  loading="lazy"
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full sm:w-24 h-24 object-cover rounded"
                />
                <div>
                  <h4 className="font-bold text-sm md:text-base mb-1">{item.title}</h4>
                  <ul className="list-disc pl-5 text-gray-600 text-xs">
                    {item.content.slice(0, 2).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-600">No related articles found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaperDetail;