"""
Script to deduplicate Qdrant points by article_id.
Run inside the BriefCast/ai directory:
    python dedup_qdrant.py
"""
import os
from qdrant_client import QdrantClient

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "articles_collection"

qdrant = QdrantClient(url=QDRANT_URL)

print("Scanning Qdrant for duplicates...")

seen_article_ids = {}   # article_id -> first point_id we saw
ids_to_delete = []      # point_ids to delete

offset = None
total_scanned = 0

while True:
    # Scroll through all points in batches of 100
    results, next_offset = qdrant.scroll(
        collection_name=COLLECTION_NAME,
        limit=100,
        offset=offset,
        with_payload=True,
        with_vectors=False,
    )

    if not results:
        break

    for point in results:
        article_id = point.payload.get("article_id", "")
        point_id = point.id
        total_scanned += 1

        if not article_id:
            continue

        if article_id in seen_article_ids:
            # Duplicate! Mark for deletion
            ids_to_delete.append(point_id)
        else:
            # First time seeing this article_id, keep it
            seen_article_ids[article_id] = point_id

    if next_offset is None:
        break
    offset = next_offset

print(f"Scanned {total_scanned} points.")
print(f"Unique articles: {len(seen_article_ids)}")
print(f"Duplicates to delete: {len(ids_to_delete)}")

if ids_to_delete:
    # Delete in batches of 100
    batch_size = 100
    for i in range(0, len(ids_to_delete), batch_size):
        batch = ids_to_delete[i:i+batch_size]
        qdrant.delete(
            collection_name=COLLECTION_NAME,
            points_selector=batch,
        )
        print(f"Deleted batch {i//batch_size + 1}: {len(batch)} points")

    print(f"✅ Done! Deleted {len(ids_to_delete)} duplicate points.")
else:
    print("✅ No duplicates found!")
