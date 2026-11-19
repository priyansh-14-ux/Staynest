import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ComplaintCategory(str, enum.Enum):
    ELECTRICAL = "ELECTRICAL"
    PLUMBING = "PLUMBING"
    FURNITURE = "FURNITURE"
    CLEANLINESS = "CLEANLINESS"
    INTERNET = "INTERNET"
    OTHER = "OTHER"

class ComplaintPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"

class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(60), unique=True, index=True, nullable=False)  # e.g. "TCK-2026-091"
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    
    category = Column(Enum(ComplaintCategory), default=ComplaintCategory.ELECTRICAL, nullable=False)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.MEDIUM, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    attachment_url = Column(String(255), nullable=True)
    
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.OPEN, nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    resident = relationship("Resident", back_populates="complaints")
    room = relationship("Room", back_populates="complaints")
    assigned_to = relationship("User", back_populates="complaints_assigned")
