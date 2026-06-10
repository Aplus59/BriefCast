import time
import datetime
import sys
from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager
from ingestion.scheduler import start_scheduler
from core.config import settings
from ingestion.fetchers.guardian import fetch_guardian_news
from processing.worker import process_unsummarized_articles
from core.db import articles_en_collection, articles_fr_collection

def run_backfill():
    print(f"Starting BACKFILL mode for the last {settings.BACKFILL_DAYS} days...")
    for i in range(settings.BACKFILL_DAYS):
        target_date = datetime.datetime.utcnow() - datetime.timedelta(days=i)
        date_str = target_date.strftime("%Y-%m-%d")
        print(f"--- Fetching 30 articles for {date_str} ---")
        fetch_guardian_news(target_date_str=date_str, limit=30)
        
    print("Finished fetching. Now summarizing all unsummarized articles...")
    while True:
        en_count = articles_en_collection.count_documents({"summary": {"$in": [None, ""]}})
        fr_count = articles_fr_collection.count_documents({"summary": {"$in": [None, ""]}})
        if en_count == 0 and fr_count == 0:
            print("All articles have been summarized.")
            break
        print(f"Remaining to summarize - EN: {en_count}, FR: {fr_count}")
        process_unsummarized_articles()
        time.sleep(2) # Give it a small breath between batches
        
    print("Backfill complete. Sleeping forever so the container doesn't restart...")
    while True:
        time.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.MODE != "backfill":
        # Startup: Start background scheduler
        start_scheduler()
    yield

app = FastAPI(title="BriefCast AI Service", lifespan=lifespan)

@app.get("/health")
def health_check():
    return {"status": "AI Service is healthy"}

if __name__ == "__main__":
    if settings.MODE == "backfill":
        run_backfill()
    else:
        uvicorn.run(app, host="0.0.0.0", port=8000)
