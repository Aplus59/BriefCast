import { Card, CardContent, Link, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';

// Function to format date
const formatDate = (datetime) => {
  if (!datetime || datetime === "N/A") return "";
  const date = new Date(datetime);
  if (isNaN(date.getTime())) return datetime; // fallback to original string if invalid
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function NewsCard({ title, content, imageUrl, linkPaper, datetime, favorite, onFavoriteClick, audioUrl, isPlaying, onPlayAudio, reliabilityScore, topic, source }) {
  const language = localStorage.getItem("language") || "en";
  return (
    <Card className="flex items-center gap-4 paper-list rounded-lg">
      <img src={imageUrl} loading="lazy" alt="news" className="w-[26vh] h-[25vh] object-cover rounded" />
      <CardContent className="p-0 w-full">
        <Typography variant="h6" className="mb-2 title">
          {title}
        </Typography>
        <ul className="list-disc pl-5 text-gray-600">
          {content.map((item, index) => (
            <li key={index}>
              <Typography variant="body2">{item}</Typography>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 items-center mt-2 mb-1">
          {topic && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              {topic}
            </span>
          )}
          {source && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
              {source}
            </span>
          )}
          {reliabilityScore !== undefined && reliabilityScore > 0 && (
            <div className={`px-2 py-0.5 rounded text-white text-xs font-bold ${reliabilityScore >= 8 ? 'bg-green-500' : reliabilityScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}>
              ✓ {reliabilityScore}/10
            </div>
          )}
        </div>
        <div className="flex flex-row justify-end items-center mt-1 gap-2 flex-wrap">
          <Link href={linkPaper} target="_blank" rel="noopener noreferrer" className="orange">
            {language === 'fr' ? 'Lien vers l\'article' : 'Article Link'}
          </Link>
          <div className="ml-3">{formatDate(datetime)}</div>
          <button className="ml-3" onClick={(e) => { e.stopPropagation(); onFavoriteClick(); }}>
            {favorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </button>
          {audioUrl && (
            <button className="ml-3" onClick={(e) => { e.stopPropagation(); onPlayAudio(); }}>
              {isPlaying ? <PauseIcon /> : <VolumeUpIcon />}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}