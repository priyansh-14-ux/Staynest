from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VisitorCreate(BaseModel):
    resident_id: int
    visitor_name: str
    phone: str
    relationship_to_resident: str = "Parent"
    id_proof_type: str = "Aadhaar Card"
    id_proof_number: str
    purpose: str
    remarks: Optional[str] = None

class VisitorCheckOut(BaseModel):
    remarks: Optional[str] = None

class VisitorOut(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    registration_number: str
    room_number: Optional[str] = None
    visitor_name: str
    phone: str
    relationship_to_resident: str
    id_proof_type: str
    id_proof_number: str
    purpose: str
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    logged_by: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True
