from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.resident import ResidentStatus

class ResidentBase(BaseModel):
    registration_number: str
    course: str
    department: Optional[str] = "Engineering"
    year_of_study: int = 1
    gender: str = "Male"
    dob: Optional[date] = None
    blood_group: Optional[str] = "B+"
    permanent_address: Optional[str] = None
    guardian_name: str
    guardian_relation: str = "Parent"
    guardian_phone: str
    guardian_email: Optional[str] = None

class ResidentCreate(ResidentBase):
    # User account fields
    email: str
    username: str
    full_name: str
    phone: str
    password: Optional[str] = "Hostel@123"

class ResidentUpdate(BaseModel):
    course: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    blood_group: Optional[str] = None
    permanent_address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[str] = None
    status: Optional[ResidentStatus] = None
    avatar_url: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None

class CurrentRoomInfo(BaseModel):
    hostel_name: str
    block_name: str
    floor_name: str
    room_number: str
    bed_number: str
    room_type: str
    bed_id: int
    allocation_id: int

class ResidentOut(ResidentBase):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    status: ResidentStatus
    admission_date: date
    avatar_url: Optional[str] = None
    current_room: Optional[CurrentRoomInfo] = None
    total_dues: float = 0.0

    class Config:
        from_attributes = True

class ResidentDetailOut(ResidentOut):
    roommates: List[dict] = []
    created_at: datetime
