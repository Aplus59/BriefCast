import { Card, CardContent, Link, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';

export default function NewsCard({ title, content, imageUrl, linkPaper, datetime, favorite, onFavoriteClick, audioUrl, isPlaying, onPlayAudio }) {
  return (
    <Card className="flex items-center gap-4 paper-list rounded-lg">
      <img src={imageUrl} alt="news" className="w-[26vh] h-[25vh] object-cover rounded" />
      <CardContent className="p-0 w-full">
        <Typography variant="h6" className="font-semibold mb-2">
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
          <div className="ml-5">{datetime}</div>
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