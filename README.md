# BriefCast: News Summarization System

## Problem Statement
- **Information Overload**: There are too many articles and too little time to consume them.
- **Accessibility**: Elderly, visually impaired, and busy individuals cannot easily access written news.
- **Credibility**: Social media delivers fast news but often lacks credibility.
- **Limitations of Existing Tools**: Current summarization and Text-to-Speech (TTS) tools are limited and lack personalization.

Our goal is to make trusted news more accessible by converting articles into concise summaries and audio. We leverage automated data ingestion to collect up-to-date information, natural language processing to deliver personalized digests, and a robust architecture to ensure reliable performance.

## Project Overview
BriefCast automatically collects news from four sources:
- 🇬🇧 **BBC News** (English, via RSS feed)
- 🇬🇧 **The Guardian** (English, via official API)
- 🇫🇷 **France 24** (French, via RSS feed)
- 🇫🇷 **Le Monde** (French, via RSS feed)

Articles are fetched on an hourly schedule, summarized using an LLM, converted into audio, and stored with vector embeddings for similarity-based recommendations.

## System Architecture

### 1. News Ingestion
- **Sources**:
  - **BBC News** (English) — RSS feed at `https://feeds.bbci.co.uk/news/rss.xml`
  - **The Guardian** (English) — Official Guardian API
  - **France 24** (French) — RSS feed at `https://www.france24.com/fr/rss`
  - **Le Monde** (French) — RSS feed at `https://www.lemonde.fr/rss/une.xml`
- **Schedule**: Both the RSS fetcher and the Guardian API fetcher run every 60 minutes using APScheduler. The Guardian fetcher also supports a `backfill` mode to populate historical data (configurable via `BACKFILL_DAYS`).
- **Process**: Articles are parsed using `feedparser` and `BeautifulSoup`. If an RSS summary is too short (<200 characters), the full article page is scraped. Articles with fewer than 50 characters of content are skipped entirely. Topics are automatically extracted from the article URL structure.
- **Output**: Clean, structured article documents stored in MongoDB (`briefcast` database, `articles_en` and `articles_fr` collections).

### 2. Processing Pipeline
The AI processing worker (`worker.py`) runs every 5 minutes and applies the following steps to each unprocessed article:

1. **Summarization**: Uses `gpt-4o-mini` to generate a concise 3-4 sentence summary in the article's original language (English or French). Articles that cannot be summarized are **deleted** from the database automatically.
2. **Fact-checking**: Cross-references the article title against Google Search results via the SerpAPI. A second `gpt-4o-mini` call evaluates the search context against the summary and returns a reliability score from 0 to 10.
3. **Text-to-Speech (TTS)**: Uses OpenAI's `tts-1` model to convert the summary to audio. The voice is selected based on language (`alloy` for English, `nova` for French). The output `.mp3` file is uploaded to Google Cloud Storage (GCS) and stored as a public URL.
4. **Vector Embeddings**: Generates a 1536-dimensional embedding using the `text-embedding-3-small` model and stores it in **Qdrant** with article metadata (title, language, source) for cosine similarity search.

### 3. Frontend
Built for a fast and clean user experience:
- **Tech Stack**: React 19, Vite 6, Material UI 7.
- **Routing**: `react-router-dom` for client-side navigation.
- **Features**: Article browsing with language switching (EN/FR), topic filtering (multi-select), date range filtering, reliability score badges, audio playback (single article and playlist mode), and pagination with skeleton loading for a smooth experience.
- **No authentication required**: The app is fully public — no login or sign-up needed.
- **Serving**: Built as a static bundle and served via Nginx in Docker.

### 4. Backend
A lightweight Go API server serving the frontend:
- **Language**: Go 1.22 using the standard `net/http` library (no external web framework).
- **Endpoints**:
  - `GET /api/v1/articles` — Paginated article list with filtering by language, topic, date range, search query, and sort order.
  - `GET /api/v1/articles/{id}` — Single article lookup across both EN and FR collections.
  - `GET /api/v1/topics` — Dynamically fetches distinct topics from MongoDB, normalizing URL-encoded characters.
- **Database**: MongoDB for article storage, Redis for caching. Nginx acts as a reverse proxy.

### 5. Infrastructure
All services are orchestrated with **Docker Compose**:
- `frontend` (React/Nginx, port 3000)
- `backend` (Go API, port 8080)
- `ai_service` (Python/FastAPI, port 8000)
- `redis` (port 6379)
- `qdrant` (port 6333)
- MongoDB is expected to be provided externally via the `MONGO_URI` environment variable.

## Environment Variables
Key variables required in a `.env` file at the project root:
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `OPENAI_API_KEY` | OpenAI API key (for summarization, TTS, embeddings) |
| `SERPAPI_API_KEY` | SerpAPI key (for fact-checking) |
| `GUARDIAN_API_KEY` | The Guardian API key (for English news ingestion via Guardian API) |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket name (for audio files) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCS service account credentials JSON |
| `MODE` | `continuous` (default, runs on hourly schedule) or `backfill` (fetches historical Guardian data) |
| `BACKFILL_DAYS` | Number of past days to backfill when using `MODE=backfill` (default: 30) |

## Getting Started

```bash
# Copy environment file and fill in your API keys
cp .env.example .env

# Start all services
docker compose up --build
```

The app will be available at **http://localhost:3000**.

## Future Improvements
- **Mobile App**: Launch a mobile application for on-the-go listening and reading.
- **Multilingual Expansion**: Add support for more languages beyond English and French.
- **Notifications**: Offer summaries via email, mobile notifications, or podcast-style playlists.
- **User Feedback Loop**: Let users rate summaries and audio quality to continuously improve model outputs.
