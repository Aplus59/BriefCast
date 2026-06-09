import { Card, CardContent, Link, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';

// Function to format date
const formatDate = (datetime) => {
  const date = new Date(datetime);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function NewsCard({ title, content, imageUrl, linkPaper, datetime, favorite, onFavoriteClick, audioUrl, isPlaying, onPlayAudio }) {
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
        <div className="flex flex-row justify-end items-center">
          <Link href={linkPaper} className="orange">Link bài báo</Link>
          <div className="ml-5">{formatDate(datetime)}</div>
          <button className="ml-5" onClick={(e) => { e.stopPropagation(); onFavoriteClick(); }}>
            {favorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </button>
          {audioUrl && (
            <button className="ml-5" onClick={(e) => { e.stopPropagation(); onPlayAudio(); }}>
              {isPlaying ? <PauseIcon /> : <VolumeUpIcon />}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}