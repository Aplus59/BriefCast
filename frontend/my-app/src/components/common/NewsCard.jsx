import { Card, CardContent, Link, Typography } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';

const formatDate = (datetime) => {
  if (!datetime || datetime === "N/A") return "";
  const date = new Date(datetime);
  if (isNaN(date.getTime())) return datetime;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function NewsCard({ title, content, imageUrl, linkPaper, datetime, audioUrl, isPlaying, onPlayAudio, reliabilityScore, topic, source }) {
  const language = localStorage.getItem("language") || "en";

  return (
    <Card className="flex flex-col sm:flex-row items-start paper-list rounded-lg overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Image — slightly square, fixed width on desktop, prevents vertical stretching */}
      <div className="w-full sm:w-56 shrink-0 aspect-[4/3] sm:aspect-square sm:py-4 sm:pl-4">
        <img
          src={imageUrl}
          loading="lazy"
          alt="news"
          className="w-full h-full object-cover block sm:rounded-lg"
          onError={(e) => { e.target.src = 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg'; }}
        />
      </div>

      {/* Content */}
      <CardContent className="flex flex-col p-4 w-full flex-1 min-h-full">

        {/* Title */}
        <Typography
          className="text-base sm:text-lg leading-tight mb-2"
          sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.35 }}
        >
          {title}
        </Typography>

        {/* Summary — Full text, responsive font size */}
        <div className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
          {content.map((item, index) => (
            <p key={index} className="mb-1">{item}</p>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
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
          {reliabilityScore > 0 && (
            <span 
              className="px-2 py-0.5 rounded text-xs font-bold text-white"
              style={{ backgroundColor: reliabilityScore >= 8 ? '#22c55e' : reliabilityScore >= 5 ? '#eab308' : '#ef4444' }}
            >
              ✓ {reliabilityScore}/10
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 mt-auto">
          <Link href={linkPaper} target="_blank" rel="noopener noreferrer"
            className="text-xs sm:text-sm font-semibold text-orange-500 hover:text-orange-600 no-underline">
            {language === 'fr' ? "Lien vers l'article" : 'Article Link'}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{formatDate(datetime)}</span>
            {audioUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); onPlayAudio(); }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                {isPlaying ? <PauseIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
              </button>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}