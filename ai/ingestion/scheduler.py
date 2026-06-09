from apscheduler.schedulers.background import BackgroundScheduler
from ingestion.fetchers.guardian import fetch_guardian_news
from ingestion.fetchers.rss import fetch_rss_feeds
from processing.worker import process_unsummarized_articles

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # Run fetchers every 1 hour
    scheduler.add_job(fetch_guardian_news, 'interval', minutes=60)
    scheduler.add_job(fetch_rss_feeds, 'interval', minutes=60)
    
    # Run AI processing worker every 5 minutes
    scheduler.add_job(process_unsummarized_articles, 'interval', minutes=5)
    
    # Run immediately on startup
    fetch_guardian_news()
    fetch_rss_feeds()
    process_unsummarized_articles()
    
    scheduler.start()
    print("Scheduler started. News ingestion and AI processing running.")
