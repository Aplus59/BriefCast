import os
import uuid
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http import models
from core.config import settings

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, timeout=30.0)

# Initialize Qdrant Client
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "articles_collection"

try:
    if settings.QDRANT_API_KEY:
        qdrant = QdrantClient(url=QDRANT_URL, api_key=settings.QDRANT_API_KEY)
    else:
        qdrant = QdrantClient(url=QDRANT_URL)
    # Check if collection exists, if not create it
    collections = [col.name for col in qdrant.get_collections().collections]
    if COLLECTION_NAME not in collections:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=1536, # OpenAI text-embedding-3-small dimension
                distance=models.Distance.COSINE
            )
        )
        print(f"Created Qdrant collection: {COLLECTION_NAME}")
except Exception as e:
    print(f"Warning: Qdrant Client could not be initialized: {e}")
    qdrant = None

def generate_and_store_embedding(text: str, article_metadata: dict) -> str:
    """Generates vector embedding and stores it in Qdrant.
    Uses a deterministic UUID based on article_id to prevent duplicates.
    """
    if not text or not qdrant:
        return None

    article_id = article_metadata.get("article_id", "")
    if not article_id:
        return None

    try:
        # 1. Generate Embedding
        response = openai_client.embeddings.create(
            input=[text],
            model="text-embedding-3-small"
        )
        vector = response.data[0].embedding

        # 2. Create deterministic UUID from article_id
        # uuid5 with same article_id always produces same UUID → upsert overwrites instead of duplicating
        point_id = str(uuid.uuid5(uuid.NAMESPACE_OID, article_id))

        # 3. Store in Qdrant (upsert = insert or overwrite)
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=article_metadata
                )
            ]
        )
        return point_id
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None
