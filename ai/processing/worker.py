import time
from core.db import articles_collection
from services.openai_service import summarize_article
from services.fact_checking import fact_check_article
from services.audio_service import generate_and_upload_audio
from services.embedding_service import generate_and_store_embedding

def process_unsummarized_articles():
    print("Running AI Processing Worker...")
    # Find articles that haven't been summarized yet
    articles = articles_collection.find({"summary": {"$in": [None, ""]}}).limit(10)
    
    for article in articles:
        try:
            print(f"Processing: {article.get('title')}")
            article_id_str = str(article["_id"])
            language = article.get("language", "en")
            
            # 1. Summarize
            summary = summarize_article(article.get("raw_content", ""), language)
            
            if not summary:
                continue
                
            # 2. Fact-Check
            score = fact_check_article(article.get("title", ""), summary)
            
            # 3. Generate Audio
            audio_url = generate_and_upload_audio(summary, article_id_str, language)
            
            # 4. Generate Embeddings (for the summary text to find similar summaries)
            metadata = {
                "article_id": article_id_str,
                "title": article.get("title", ""),
                "language": language,
                "source": article.get("source", "")
            }
            embedding_id = generate_and_store_embedding(summary, metadata)
            
            # 5. Update DB
            articles_collection.update_one(
                {"_id": article["_id"]},
                {"$set": {
                    "summary": summary,
                    "reliability_score": score,
                    "audio_url": audio_url,
                    "embedding_id": embedding_id
                }}
            )
            print(f"Finished processing. Score: {score}, Audio: {bool(audio_url)}")
            time.sleep(1) # Rate limiting
            
        except Exception as e:
            print(f"Error processing article {article.get('_id')}: {e}")
