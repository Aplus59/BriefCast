import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
import requests
from core.db import articles_collection

RSS_FEEDS = [
    {"url": "https://feeds.bbci.co.uk/news/rss.xml", "source": "BBC News", "language": "en"},
    {"url": "https://www.france24.com/fr/rss", "source": "France 24", "language": "fr"},
    {"url": "https://www.lemonde.fr/rss/une.xml", "source": "Le Monde", "language": "fr"}
]

def clean_html(html_content: str) -> str:
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text(separator="\n", strip=True)

def fetch_full_text(url: str) -> str:
    # A simple scraper for full text if RSS only provides summary
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.content, "html.parser")
        
        # We try to extract paragraph texts. This is a naive approach.
        paragraphs = soup.find_all("p")
        text = "\n".join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20])
        return text
    except Exception:
        return ""

def fetch_rss_feeds():
    print("Fetching news from RSS feeds...")
    for feed_info in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"])
            for entry in feed.entries[:10]: # Process top 10 latest entries
                url = entry.link
                title = entry.title
                
                if articles_collection.find_one({"url": url}):
                    continue
                
                # Use published parsed if available
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    from time import mktime
                    published_at = datetime.fromtimestamp(mktime(entry.published_parsed))
                else:
                    published_at = datetime.utcnow()
                    
                # Get raw content (either from summary or fetch the page)
                raw_content = clean_html(entry.get("summary", ""))
                
                # If summary is too short, try fetching the full text
                if len(raw_content) < 200:
                    fetched_text = fetch_full_text(url)
                    if fetched_text:
                        raw_content = fetched_text

                article_doc = {
                    "title": title,
                    "url": url,
                    "source": feed_info["source"],
                    "language": feed_info["language"],
                    "published_at": published_at,
                    "raw_content": raw_content,
                    "created_at": datetime.utcnow()
                }
                
                articles_collection.insert_one(article_doc)
                print(f"Saved RSS: {title}")
                
        except Exception as e:
            print(f"Error fetching RSS {feed_info['url']}: {e}")
