from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ArticleBase(BaseModel):
    title: str
    url: str
    source: str
    language: str # 'en' or 'fr'
    published_at: datetime
    raw_content: str
    image_url: Optional[str] = None
    topic: Optional[str] = None
    
class ArticleInDB(ArticleBase):
    id: str = Field(alias="_id", default=None)
    summary: Optional[str] = None
    reliability_score: Optional[int] = None
    audio_url: Optional[str] = None
    embedding_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
