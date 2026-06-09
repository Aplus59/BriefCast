from pymongo import MongoClient
from core.config import settings

# Global MongoDB Client
client = MongoClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]
articles_collection = db["articles"]

# Create indexes
articles_collection.create_index("url", unique=True)
articles_collection.create_index("published_at", order=-1)
