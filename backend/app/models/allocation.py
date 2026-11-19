import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AllocationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    TRANSFERRED = "TRANSFERRED"
    VACATED = "VACATED"

class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=False)
    academic_year = Column(String(50), default="2026-2027", nullable=False)
    allocated_from = Column(Date, default=date.today, nullable=False)
    allocated_to = Column(Date, nullable=True)
    status = Column(Enum(AllocationStatus), default=AllocationStatus.ACTIVE, nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    resident = relationship("Resident", back_populates="allocations")
    bed = relationship("Bed", back_populates="allocations")
