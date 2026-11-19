from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False)
    visitor_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)
    relationship_to_resident = Column(String(50), default="Friend", nullable=False)
    id_proof_type = Column(String(50), default="Aadhaar Card", nullable=False)
    id_proof_number = Column(String(50), nullable=False)
    purpose = Column(String(255), nullable=False)
    
    check_in_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    logged_by = Column(String(150), default="Gate Security", nullable=False)
    remarks = Column(Text, nullable=True)

    resident = relationship("Resident", back_populates="visitors")
