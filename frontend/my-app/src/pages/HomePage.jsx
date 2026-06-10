import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const TOPICS_EN = ["World", "Politics", "Technology", "Science", "Health", "Business", "Sports", "Entertainment"];
const TOPICS_FR = ["Monde", "Politique", "Technologie", "Sciences", "Santé", "Economie", "Sports", "Culture"];

export default function HomeContent() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");

  // Listen for language changes from Header
  useEffect(() => {
    const handleLangChange = (e) => {
      setLanguage(e.detail.language);
    };
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const topics = language === "fr" ? TOPICS_FR : TOPICS_EN;

  const handleTopicClick = (topic) => {
    localStorage.setItem("topic_title", topic);
    navigate(`/papers?topic=${topic}`);
  };

  return (
    <div className="min-h-[80vh] w-full px-4 md:px-16 xl:px-32 flex flex-col justify-center items-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-gray-800 mb-12 tracking-tight">
        {language === "fr" ? "Que voulez-vous lire aujourd'hui ?" : "What do you want to read today?"}
      </h1>

      {/* Horizontal scrolling container */}
      <div className="w-full overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory hide-scrollbar">
        <div className="flex flex-row gap-6 w-max mx-auto">
          {topics.map((topic, index) => (
            <div
              key={index}
              onClick={() => handleTopicClick(topic)}
              className="snap-center cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center p-8 min-w-[240px] md:min-w-[280px] min-h-[160px] md:min-h-[180px] border border-gray-100 hover:border-blue-400 group"
            >
              <h2 className="text-2xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                {topic}
              </h2>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx="true">{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}