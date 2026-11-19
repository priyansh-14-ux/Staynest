from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.attendance import AttendanceStatus

class AttendanceMarkItem(BaseModel):
    resident_id: int
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None

class AttendanceBulkCreate(BaseModel):
    date: date
    entries: List[AttendanceMarkItem]

class AttendanceOut(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    registration_number: str
    room_number: Optional[str] = None
    date: date
    status: AttendanceStatus
    marked_by: str
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceRegisterRow(BaseModel):
    resident_id: int
    resident_name: str
    registration_number: str
    room_number: str
    block_name: str
    status: AttendanceStatus
    has_approved_leave: bool = False
    leave_id: Optional[int] = None
    attendance_id: Optional[int] = None
