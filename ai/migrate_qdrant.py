"""
Script to migrate data from local Qdrant to Qdrant Cloud.
Run inside the BriefCast/ai directory:
    python migrate_qdrant.py
"""
import os
import sys
from qdrant_client import QdrantClient
from qdrant_client.http import models
from dotenv import load_dotenv

# Load env vars to get QDRANT_URL and QDRANT_API_KEY for cloud
load_dotenv()

# Try to use 'qdrant' host if inside docker compose network, else localhost
LOCAL_QDRANT_URL = "http://qdrant:6333"
try:
    import socket
    socket.gethostbyname("qdrant")
except Exception:
    LOCAL_QDRANT_URL = "http://localhost:6333"
CLOUD_QDRANT_URL = os.getenv("QDRANT_URL")
CLOUD_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "articles_collection"

if not CLOUD_QDRANT_URL or not CLOUD_API_KEY:
    print("❌ Lỗi: Bạn cần cấu hình QDRANT_URL và QDRANT_API_KEY trong file .env trước khi migrate!")
    sys.exit(1)

print("Connecting to local Qdrant...")
local_client = QdrantClient(url=LOCAL_QDRANT_URL)

print("Connecting to Qdrant Cloud...")
cloud_client = QdrantClient(url=CLOUD_QDRANT_URL, api_key=CLOUD_API_KEY)

# Ensure collection exists on cloud
try:
    collections = [col.name for col in cloud_client.get_collections().collections]
    if COLLECTION_NAME not in collections:
        print(f"Creating collection '{COLLECTION_NAME}' on Qdrant Cloud...")
        cloud_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=1536, # OpenAI text-embedding-3-small dimension
                distance=models.Distance.COSINE
            )
        )
        print("Creating payload index for 'language'...")
        cloud_client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="language",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )
except Exception as e:
    print(f"❌ Lỗi khi setup collection trên cloud: {e}")
    sys.exit(1)

print("Starting migration...")
offset = None
total_migrated = 0

while True:
    # Scroll from local
    results, next_offset = local_client.scroll(
        collection_name=COLLECTION_NAME,
        limit=100,
        offset=offset,
        with_payload=True,
        with_vectors=True, # We need the vectors to migrate!
    )

    if not results:
        break

    # Prepare points for cloud
    points_to_upload = []
    for point in results:
        points_to_upload.append(
            models.PointStruct(
                id=point.id,
                vector=point.vector,
                payload=point.payload
            )
        )
    
    # Upload to cloud
    if points_to_upload:
        cloud_client.upsert(
            collection_name=COLLECTION_NAME,
            points=points_to_upload
        )
        total_migrated += len(points_to_upload)
        print(f"  ... migrated {total_migrated} points")

    if next_offset is None:
        break
    offset = next_offset

print(f"✅ Migration hoàn tất! Đã chuyển thành công {total_migrated} vector lên Qdrant Cloud.")
