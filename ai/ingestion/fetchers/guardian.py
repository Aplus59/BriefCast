import requests
from datetime import datetime
from bs4 import BeautifulSoup
from core.config import settings
from core.db import articles_collection

GUARDIAN_API_URL = "https://content.guardianapis.com/search"

def clean_html(html_content: str) -> str:
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text(separator="\n", strip=True)

def fetch_guardian_news():
    print("Fetching news from The Guardian API...")
    params = {
        "api-key": settings.GUARDIAN_API_KEY,
        "show-blocks": "body",
        "show-fields": "thumbnail",
        "page-size": 1,
        "order-by": "newest"
    }
    
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
            
            # Check if exists
            if articles_collection.find_one({"url": url}):
                continue
                
            article_doc = {
                "title": title,
                "url": url,
                "source": "The Guardian",
                "language": "en",
                "published_at": published_at,
                "raw_content": raw_content,
                "image_url": image_url,
                "created_at": datetime.utcnow()
            }
            
            articles_collection.insert_one(article_doc)
            print(f"Saved: {title}")
            
    except Exception as e:
        print(f"Error fetching Guardian news: {e}")
