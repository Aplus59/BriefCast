import time
from core.db import articles_collection
from services.openai_service import summarize_article
from services.fact_checking import fact_check_article

def process_unsummarized_articles():
    print("Running AI Processing Worker...")
    # Find articles that haven't been summarized yet
    articles = articles_collection.find({"summary": {"$in": [None, ""]}}).limit(10)
    
    for article in articles:
        try:
            print(f"Processing: {article.get('title')}")
            
            # 1. Summarize
            summary = summarize_article(article.get("raw_content", ""), article.get("language", "en"))
            
            if not summary:
                continue
                
            # 2. Fact-Check
            score = fact_check_article(article.get("title", ""), summary)
            
            # 3. Update DB
            articles_collection.update_one(
                {"_id": article["_id"]},
                {"$set": {
                    "summary": summary,
                    "reliability_score": score
                }}
            )
            print(f"Finished processing. Score: {score}")
            time.sleep(1) # Rate limiting
            
        except Exception as e:
            print(f"Error processing article {article.get('_id')}: {e}")
