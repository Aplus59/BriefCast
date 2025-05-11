import { useState, useEffect } from "react";
import { Grid, Typography, Button, Box } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import qs from "qs";

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
  },
];

function PaperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(defaultArticle);
  const [relatedArticles, setRelatedArticles] = useState(defaultRelatedArticles);
  const [error, setError] = useState(null);

  // Hàm tạo lệnh curl từ cấu hình axios
  const printCurlCommand = (url, config) => {
    const { headers, params } = config;
    const queryString = params ? qs.stringify(params, { arrayFormat: "brackets", skipNulls: true }) : "";
    const headerStrings = Object.entries(headers).map(([key, value]) => `-H "${key}: ${value}"`);
    const curlCommand = [
      "curl -X GET",
      `"${url}${queryString ? "?" + queryString : ""}"`,
      ...headerStrings,
    ].join(" \\\n  ");
    console.log("Curl command:\n", curlCommand);
    return curlCommand;
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchArticle = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            lang: "en",
            Accept: "application/json",
          },
        };

        // Gọi API chi tiết bài viết
        printCurlCommand(`/api/v1/articles/${id}`, config);
        const response = await axios.get(`/api/v1/articles/${id}`, config);
        console.log("Article API response:", response.data.data);

        if (response.data.data) {
          const item = response.data.data; // API returns article directly
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
          };
          setArticle(formattedArticle);
          setError(null);

          // Gọi API bài viết liên quan nếu có topicId
          if (formattedArticle.topicId) {
            const relatedConfig = {
              headers: {
                Authorization: `Bearer ${token}`,
                lang: "en",
                Accept: "application/json",
              },
              params: {
                topic_ids: [formattedArticle.topicId],
                page: 1,
                limit: 4,
              },
              paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: "brackets", skipNulls: true });
              },
            };

            printCurlCommand("/api/v1/articles", relatedConfig);
            const relatedResponse = await axios.get("/api/v1/articles", relatedConfig);
            console.log("Related articles API response:", relatedResponse.data);

            if (relatedResponse.data.data && Array.isArray(relatedResponse.data.data.data)) {
              const formattedRelated = relatedResponse.data.data.data
                .filter((relatedItem) => relatedItem.id !== id)
                .map((relatedItem) => ({
                  id: relatedItem.id || `related-${Math.random()}`,
                  title: relatedItem.title || "Untitled",
                  content: relatedItem.summary || ["No summary available"],
                  imageUrl:
                    relatedItem.image ||
                    "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
                }));
              setRelatedArticles(formattedRelated);
            } else {
              console.warn("Invalid related articles API response, using default data.");
              setRelatedArticles(defaultRelatedArticles);
            }
          } else {
            setRelatedArticles(defaultRelatedArticles);
          }
        } else {
          console.warn("Invalid article API response, using default data.");
          setArticle(defaultArticle);
          setRelatedArticles(defaultRelatedArticles);
          setError("Invalid data received from server.");
        }
      } catch (error) {
        console.error("API error:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        }
        setArticle(defaultArticle);
        setRelatedArticles(defaultRelatedArticles);
        setError(
          error.response?.data?.message || "Failed to fetch article. Please try again later."
        );
      }
    };

    fetchArticle();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-gray-100 px-4 md:px-20">
      {/* Header */}
      <div className="flex justify-between items-center w-full lg:max-w-4xl xl:max-w-6xl mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Tin tức</h1>
        <VolumeUpIcon />
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Featured Article */}
      <div className="bg-blue-900 text-white rounded-xl shadow p-6 w-full lg:max-w-4xl xl:max-w-6xl mb-8">
        <div className="flex flex-col md:flex-row md:space-x-6">
          <img
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
              <span className="mt-2 md:mt-0 ml-2">Ngày xuất bản: {article.datetime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <div className="w-full lg:max-w-4xl xl:max-w-6xl">
        <h3 className="text-xl font-semibold mb-4">Bài báo liên quan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relatedArticles.length > 0 ? (
            relatedArticles.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 cursor-pointer"
                onClick={() => navigate(`/papers/${item.id}`)}
              >
                <img
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