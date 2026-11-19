import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class GenderType(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    COED = "COED"

class RoomType(str, enum.Enum):
    SINGLE_AC = "SINGLE_AC"
    SINGLE_NON_AC = "SINGLE_NON_AC"
    DOUBLE_AC = "DOUBLE_AC"
    DOUBLE_NON_AC = "DOUBLE_NON_AC"
    TRIPLE = "TRIPLE"
    DORMITORY = "DORMITORY"

class BedStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"

class Hostel(Base):
    __tablename__ = "hostels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    blocks = relationship("Block", back_populates="hostel", cascade="all, delete-orphan")

class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    hostel_id = Column(Integer, ForeignKey("hostels.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g. "A Block", "B Block"
    gender = Column(Enum(GenderType), default=GenderType.COED, nullable=False)
    total_floors = Column(Integer, default=1, nullable=False)
    warden_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    hostel = relationship("Hostel", back_populates="blocks")
    warden = relationship("User", back_populates="managed_blocks")
    floors = relationship("Floor", back_populates="block", cascade="all, delete-orphan")

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=False)
    floor_number = Column(Integer, nullable=False)  # 0 for Ground, 1, 2, 3...
    floor_name = Column(String(50), nullable=False)  # e.g. "Ground Floor", "1st Floor"

    block = relationship("Block", back_populates="floors")
    rooms = relationship("Room", back_populates="floor", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=False)
    room_number = Column(String(50), nullable=False, index=True)  # e.g. "A-101"
    room_type = Column(Enum(RoomType), default=RoomType.DOUBLE_NON_AC, nullable=False)
    capacity = Column(Integer, default=2, nullable=False)
    monthly_rate = Column(Float, default=5000.0, nullable=False)
    has_attached_bathroom = Column(Boolean, default=False)
    has_air_conditioner = Column(Boolean, default=False)
    amenities = Column(Text, default="Wi-Fi, Study Table, Wardrobe")  # Comma separated
    is_active = Column(Boolean, default=True)

    floor = relationship("Floor", back_populates="rooms")
    beds = relationship("Bed", back_populates="room", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="room")

class Bed(Base):
    __tablename__ = "beds"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    bed_number = Column(String(20), nullable=False)  # e.g. "Bed-1", "Bed-2"
    status = Column(Enum(BedStatus), default=BedStatus.AVAILABLE, nullable=False)

    room = relationship("Room", back_populates="beds")
    allocations = relationship("Allocation", back_populates="bed", cascade="all, delete-orphan")
