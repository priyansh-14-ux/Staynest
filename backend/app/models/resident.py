import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResidentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    TRANSFERRED = "TRANSFERRED"
    GRADUATED = "GRADUATED"
    SUSPENDED = "SUSPENDED"

class Resident(Base):
    __tablename__ = "residents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "REG-2026-081"
    course = Column(String(100), nullable=False)  # e.g. "B.Tech Computer Science"
    department = Column(String(100), nullable=True)  # e.g. "School of Engineering"
    year_of_study = Column(Integer, default=1, nullable=False)
    gender = Column(String(20), nullable=False)  # "Male", "Female", "Other"
    dob = Column(Date, nullable=True)
    blood_group = Column(String(10), nullable=True)
    permanent_address = Column(Text, nullable=True)
    
    # Guardian / Emergency Info
    guardian_name = Column(String(150), nullable=False)
    guardian_relation = Column(String(50), default="Parent")
    guardian_phone = Column(String(20), nullable=False)
    guardian_email = Column(String(100), nullable=True)
    
    status = Column(Enum(ResidentStatus), default=ResidentStatus.ACTIVE, nullable=False)
    admission_date = Column(Date, default=date.today)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="resident_profile")
    allocations = relationship("Allocation", back_populates="resident", cascade="all, delete-orphan")
    invoices = relationship("FeeInvoice", back_populates="resident", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="resident", cascade="all, delete-orphan")
    gate_passes = relationship("GatePass", back_populates="resident", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="resident", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="resident", cascade="all, delete-orphan")
    visitors = relationship("Visitor", back_populates="resident", cascade="all, delete-orphan")
