from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoticeBase(BaseModel):
    title: str
    content: str
    category: str = "General"
    target_audience: str = "ALL"
    is_pinned: bool = False

class NoticeCreate(NoticeBase):
    pass

class NoticeOut(NoticeBase):
    id: int
    author_id: Optional[int] = None
    author_name: Optional[str] = "Hostel Administration"
    created_at: datetime

    class Config:
        from_attributes = True
