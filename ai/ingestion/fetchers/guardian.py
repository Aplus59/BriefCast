import requests
from datetime import datetime
from bs4 import BeautifulSoup
from core.config import settings
from core.db import get_articles_collection
from urllib.parse import urlparse

GUARDIAN_API_URL = "https://content.guardianapis.com/search"

def clean_html(html_content: str) -> str:
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text(separator="\n", strip=True)

def extract_topic_from_url(url: str) -> str:
    if not url:
        return "General"
    parsed = urlparse(url)
    path_parts = [p for p in parsed.path.split('/') if p]
    if not path_parts:
        return "General"
    # For The Guardian, section is usually the first path part after domain
    if path_parts[0] in ['news', 'en', 'fr', 'rss'] and len(path_parts) > 1:
        return path_parts[1].capitalize()
    return path_parts[0].capitalize()

def fetch_guardian_news(target_date_str: str = None, limit: int = 10):
    print(f"Fetching news from The Guardian API (Date: {target_date_str or 'Latest'}, Limit: {limit})...")
    params = {
        "api-key": settings.GUARDIAN_API_KEY,
        "show-blocks": "body",
        "show-fields": "thumbnail",
        "page-size": limit,
        "order-by": "newest"
    }
    
    if target_date_str:
        params["from-date"] = target_date_str
        params["to-date"] = target_date_str
    
    try:
        response = requests.get(GUARDIAN_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("response", {}).get("results", [])
        for item in results:
            url = item.get("webUrl")
            title = item.get("webTitle")
            published_at_str = item.get("webPublicationDate")
            
            # The Guardian API returns body in blocks
            body_html = ""
            blocks = item.get("blocks", {}).get("body", [])
            if blocks:
                body_html = blocks[0].get("bodyHtml", "")
                
            raw_content = clean_html(body_html)
            published_at = datetime.fromisoformat(published_at_str.replace('Z', '+00:00'))
            
            image_url = item.get("fields", {}).get("thumbnail", None)
            topic = item.get("sectionName") or extract_topic_from_url(url)
            
            articles_en_collection = get_articles_collection("en")
            
            # Check if exists
            if articles_en_collection.find_one({"url": url}):
                continue
                
            if not raw_content or len(raw_content) < 50:
                print(f"Skipping: {title} (Content too short)")
                continue
                
            if "crossword" in title.lower() or topic.lower() == "crosswords":
                print(f"Skipping: {title} (Crossword)")
                continue
                
            article_doc = {
                "title": title,
                "url": url,
                "source": "The Guardian",
                "language": "en",
                "published_at": published_at,
                "raw_content": raw_content,
                "image_url": image_url,
                "topic": topic,
                "created_at": datetime.utcnow()
            }
            
            articles_en_collection.insert_one(article_doc)
            print(f"Saved: {title}")
            
    except Exception as e:
        print(f"Error fetching Guardian news: {e}")
