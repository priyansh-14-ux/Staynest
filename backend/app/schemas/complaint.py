from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.complaint import ComplaintCategory, ComplaintPriority, ComplaintStatus

class ComplaintCreate(BaseModel):
    category: ComplaintCategory = ComplaintCategory.ELECTRICAL
    priority: ComplaintPriority = ComplaintPriority.MEDIUM
    title: str
    description: str
    room_id: Optional[int] = None
    attachment_url: Optional[str] = None

class ComplaintAssign(BaseModel):
    assigned_to_id: int

class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    resolution_notes: Optional[str] = None

class ComplaintOut(BaseModel):
    id: int
    ticket_number: str
    resident_id: int
    resident_name: str
    registration_number: str
    room_number: Optional[str] = None
    category: ComplaintCategory
    priority: ComplaintPriority
    title: str
    description: str
    attachment_url: Optional[str] = None
    status: ComplaintStatus
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
