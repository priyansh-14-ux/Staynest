import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class LeaveType(str, enum.Enum):
    OUTPASS = "OUTPASS"
    HOME_LEAVE = "HOME_LEAVE"
    MEDICAL = "MEDICAL"
    EMERGENCY = "EMERGENCY"

class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class GatePassStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    CHECKED_OUT = "CHECKED_OUT"
    CHECKED_IN = "CHECKED_IN"
    EXPIRED = "EXPIRED"

class GateAction(str, enum.Enum):
    EXIT = "EXIT"
    ENTRY = "ENTRY"

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False)
    leave_type = Column(Enum(LeaveType), default=LeaveType.OUTPASS, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    destination = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    emergency_contact = Column(String(20), nullable=True)
    parent_informed = Column(Boolean, default=True)
    
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    reviewed_by = Column(String(150), nullable=True)
    reviewer_remarks = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    resident = relationship("Resident", back_populates="leave_requests")
    gate_pass = relationship("GatePass", back_populates="leave_request", uselist=False, cascade="all, delete-orphan")

class GatePass(Base):
    __tablename__ = "gate_passes"

    id = Column(Integer, primary_key=True, index=True)
    pass_number = Column(String(60), unique=True, index=True, nullable=False)  # e.g. "GP-2026-4012"
    leave_request_id = Column(Integer, ForeignKey("leave_requests.id"), unique=True, nullable=False)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False)
    qr_token = Column(String(255), unique=True, index=True, nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    status = Column(Enum(GatePassStatus), default=GatePassStatus.ISSUED, nullable=False)
    
    actual_out_time = Column(DateTime, nullable=True)
    actual_in_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    leave_request = relationship("LeaveRequest", back_populates="gate_pass")
    resident = relationship("Resident", back_populates="gate_passes")
    logs = relationship("GateLog", back_populates="gate_pass", cascade="all, delete-orphan")

class GateLog(Base):
    __tablename__ = "gate_logs"

    id = Column(Integer, primary_key=True, index=True)
    gate_pass_id = Column(Integer, ForeignKey("gate_passes.id"), nullable=False)
    security_officer_name = Column(String(150), nullable=False)
    action = Column(Enum(GateAction), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    remarks = Column(String(255), nullable=True)

    gate_pass = relationship("GatePass", back_populates="logs")
