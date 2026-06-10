from pymongo import MongoClient
from core.config import settings

# Global MongoDB Client
client = MongoClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]
articles_en_collection = db["articles_en"]
articles_fr_collection = db["articles_fr"]

def get_articles_collection(language: str):
    if language == 'fr':
        return articles_fr_collection
    return articles_en_collection

# Create indexes
for coll in [articles_en_collection, articles_fr_collection]:
    coll.create_index("url", unique=True)
    coll.create_index([("published_at", -1)])
