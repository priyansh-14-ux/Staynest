from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.hostel import GenderType, RoomType, BedStatus

class BedBase(BaseModel):
    bed_number: str
    status: BedStatus = BedStatus.AVAILABLE

class BedCreate(BedBase):
    pass

class BedOut(BedBase):
    id: int
    room_id: int
    current_resident_name: Optional[str] = None
    current_resident_id: Optional[int] = None
    registration_number: Optional[str] = None

    class Config:
        from_attributes = True

class RoomBase(BaseModel):
    room_number: str
    room_type: RoomType = RoomType.DOUBLE_NON_AC
    capacity: int = 2
    monthly_rate: float = 5000.0
    has_attached_bathroom: bool = False
    has_air_conditioner: bool = False
    amenities: Optional[str] = "Wi-Fi, Study Table, Wardrobe"

class RoomCreate(RoomBase):
    floor_id: int

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[RoomType] = None
    capacity: Optional[int] = None
    monthly_rate: Optional[float] = None
    has_attached_bathroom: Optional[bool] = None
    has_air_conditioner: Optional[bool] = None
    amenities: Optional[str] = None
    is_active: Optional[bool] = None

class RoomOut(RoomBase):
    id: int
    floor_id: int
    is_active: bool
    occupied_beds_count: int = 0
    available_beds_count: int = 0
    beds: List[BedOut] = []

    class Config:
        from_attributes = True

class FloorBase(BaseModel):
    floor_number: int
    floor_name: str

class FloorCreate(FloorBase):
    block_id: int

class FloorOut(FloorBase):
    id: int
    block_id: int
    rooms: List[RoomOut] = []

    class Config:
        from_attributes = True

class BlockBase(BaseModel):
    name: str
    gender: GenderType = GenderType.COED
    total_floors: int = 1
    warden_id: Optional[int] = None

class BlockCreate(BlockBase):
    hostel_id: int

class BlockOut(BlockBase):
    id: int
    hostel_id: int
    warden_name: Optional[str] = None
    floors: List[FloorOut] = []

    class Config:
        from_attributes = True

class HostelBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class HostelCreate(HostelBase):
    pass

class HostelOut(HostelBase):
    id: int
    created_at: datetime
    blocks: List[BlockOut] = []

    class Config:
        from_attributes = True

# Visual Room Grid response schema
class BedGridItem(BaseModel):
    bed_id: int
    bed_number: str
    status: BedStatus
    resident_id: Optional[int] = None
    resident_name: Optional[str] = None
    registration_number: Optional[str] = None
    course: Optional[str] = None

class RoomGridItem(BaseModel):
    room_id: int
    room_number: str
    room_type: RoomType
    capacity: int
    occupied_count: int
    available_count: int
    monthly_rate: float
    has_ac: bool
    has_attached_bath: bool
    beds: List[BedGridItem]

class FloorGridItem(BaseModel):
    floor_id: int
    floor_number: int
    floor_name: str
    rooms: List[RoomGridItem]

class BlockGridItem(BaseModel):
    block_id: int
    block_name: str
    gender: GenderType
    floors: List[FloorGridItem]
