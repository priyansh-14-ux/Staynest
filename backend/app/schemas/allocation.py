from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.allocation import AllocationStatus

class AllocationCreate(BaseModel):
    resident_id: int
    bed_id: int
    academic_year: str = "2026-2027"
    allocated_from: Optional[date] = None
    remarks: Optional[str] = None

class AllocationTransfer(BaseModel):
    allocation_id: int
    new_bed_id: int
    remarks: Optional[str] = None

class AllocationVacate(BaseModel):
    allocation_id: int
    vacated_date: Optional[date] = None
    remarks: Optional[str] = None

class AllocationOut(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    registration_number: str
    bed_id: int
    bed_number: str
    room_number: str
    block_name: str
    hostel_name: str
    academic_year: str
    allocated_from: date
    allocated_to: Optional[date] = None
    status: AllocationStatus
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
