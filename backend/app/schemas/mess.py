from pydantic import BaseModel
from typing import Optional

class MessMenuBase(BaseModel):
    day_of_week: str
    breakfast: str
    lunch: str
    snacks: str
    dinner: str
    special_item: Optional[str] = None

class MessMenuCreate(MessMenuBase):
    pass

class MessMenuOut(MessMenuBase):
    id: int

    class Config:
        from_attributes = True
