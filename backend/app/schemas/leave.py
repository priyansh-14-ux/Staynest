from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.leave import LeaveType, LeaveStatus, GatePassStatus, GateAction

class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType = LeaveType.OUTPASS
    start_time: datetime
    end_time: datetime
    destination: str
    reason: str
    emergency_contact: Optional[str] = None
    parent_informed: bool = True

class LeaveReview(BaseModel):
    status: LeaveStatus  # APPROVED or REJECTED
    remarks: Optional[str] = None

class GateLogOut(BaseModel):
    id: int
    gate_pass_id: int
    security_officer_name: str
    action: GateAction
    timestamp: datetime
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class GatePassOut(BaseModel):
    id: int
    pass_number: str
    leave_request_id: int
    resident_id: int
    resident_name: str
    registration_number: str
    room_number: Optional[str] = None
    destination: str
    reason: str
    qr_token: str
    valid_from: datetime
    valid_until: datetime
    status: GatePassStatus
    actual_out_time: Optional[datetime] = None
    actual_in_time: Optional[datetime] = None
    created_at: datetime
    logs: List[GateLogOut] = []

    class Config:
        from_attributes = True

class LeaveRequestOut(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    registration_number: str
    room_number: Optional[str] = None
    leave_type: LeaveType
    start_time: datetime
    end_time: datetime
    destination: str
    reason: str
    emergency_contact: Optional[str] = None
    parent_informed: bool
    status: LeaveStatus
    reviewed_by: Optional[str] = None
    reviewer_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    gate_pass: Optional[GatePassOut] = None

    class Config:
        from_attributes = True

class GateLogCreate(BaseModel):
    action: GateAction
    remarks: Optional[str] = None

class GatePassVerificationOut(BaseModel):
    is_valid: bool
    message: str
    gate_pass: Optional[GatePassOut] = None
    student_details: Optional[dict] = None
