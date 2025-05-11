import { IconButton } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useState, useEffect } from "react";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Card, CardContent, Link, Typography } from '@mui/material';

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
  const itemsPerPage = 4;

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
          token: localStorage.getItem("accessToken") || "",
        };

        if (!userData.userId || !userData.token) {
          navigate("/login");
        } else {
          // Fetch topics and news
          await Promise.all([fetchTopics(userData.token), fetchLatestNews(userData.token)]);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra người dùng:", error);
        navigate("/login");
      }
    };

    checkUser();
  }, [navigate]);

  // --- Fetch topics ---
  const fetchTopics = async (token) => {
    try {
      const response = await axios.get('/api/v1/topics/suggest', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Topics API response:', response.data);

      if (response.data && Array.isArray(response.data.data)) {
        const formattedTopics = response.data.data.map((topic) => ({
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
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
      setTopics(fakeTopics);
    }
  };

  // --- Fetch latest news ---
  const fetchLatestNews = async (token) => {
    try {
      const response = await axios.get('/api/v1/articles', {
        headers: {
          Authorization: `Bearer ${token}`,
          lang: 'en',
        },
        params: {
          page: 1,
          limit: 5,
          sort_by: 'published_date',
          sort_order: 'desc',
          favorite: false,
        },
      });

      const articles = response.data.data.data; // Corrected to access response.data.data
      if (articles && Array.isArray(articles) && articles.length > 0) {
        const bigNews = {
          id: articles[0].id || Math.random(),
          title: articles[0].title || 'Unknown Title',
          content: articles[0].summary || ['No content available'],
          imgUrl: articles[0].image || 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg',
          is_favorite: articles[0].is_favorite || false,
        };

        const smallNews = articles.slice(1, 5).map((article) => ({
          id: article.id || Math.random(),
          title: article.title || 'Unknown Title',
          imgUrl: article.image || 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg',
          is_favorite: article.is_favorite || false,
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
      if (error.response?.status === 400) {
        console.warn('Bad Request: Check query parameters. Using fake data.');
        setLatestNews({ big: null, small: [] });
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      } else {
        console.warn('Unexpected error, using fake data.');
        setLatestNews({ big: null, small: [] });
      }
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
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

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
          {displayedTopics.map((topic) => (
            <div
              key={topic.id}
              className="flex flex-col items-center py-4 rounded-md bg-gray cursor-pointer"
              onClick={() => handleTopicClick(topic.id)}
            >
              <span className="text-lg font-bold text-center mb-4">{topic.title}</span>
              <div className="h-[20vh] w-[25vh]">
                <img
                  src={topic.imgUrl}
                  alt={topic.title}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </div>
          ))}
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
                navigate(`/papers?topic_id=latest`);
              }}
              className="text-sm bg-gray p-2 text-black rounded-lg"
            >
              Xem thêm
            </button>
            <VolumeUpIcon />
          </div>
        </div>

        {latestNews.big && (
          <div className="flex flex-col rounded-lg shadow py-3 h-full lg:p-4 bg-gray">
            {/* Big News */}
            <Card 
              className="flex items-center gap-4 big-new rounded-lg"
              onClick={() => navigate(`/papers/${latestNews.big.id}`)}>
              <img src={latestNews.big.imgUrl} alt={latestNews.big.title} className="w-[26vh] h-[25vh] object-cover rounded" />
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
            {/* Small News */}
            <div className="grid grid-cols-1 mt-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 h-auto">
              {latestNews.small.map((news) => (
                <div
                  key={news.id}
                  className="bg-white rounded-lg shadow flex flex-col"
                  onClick={() => navigate(`/papers/${news.id}`)}
                >
                  <img
                    src={news.imgUrl}
                    alt={news.title}
                    className="w-full md:h-[20vh] xl:h-[25vh] rounded-lg object-cover"
                  />
                  <div className="p-2">
                    <h4 className="text-md font-semibold">{news.title}</h4>
                    {news.is_favorite && <FavoriteBorderIcon color="error" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}