from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StatCardData(BaseModel):
    title: str
    value: str
    change: Optional[str] = None
    is_positive: Optional[bool] = None

class DashboardStatsOut(BaseModel):
    total_hostels: int
    total_blocks: int
    total_rooms: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    maintenance_beds: int
    occupancy_rate: float
    total_active_students: int
    pending_leaves_count: int
    open_complaints_count: int
    total_fees_billed: float
    total_fees_collected: float
    total_pending_dues: float
    defaulters_count: int
    today_present_count: int
    today_absent_count: int
    today_on_leave_count: int

class BlockOccupancyData(BaseModel):
    block_name: str
    total_beds: int
    occupied_beds: int
    available_beds: int
    occupancy_percentage: float

class RoomTypeDistributionData(BaseModel):
    room_type: str
    count: int
    occupied: int

class MonthlyRevenueData(BaseModel):
    month: str
    billed: float
    collected: float

class ActivityItem(BaseModel):
    id: str
    type: str  # ADMISSION, ALLOCATION, PAYMENT, LEAVE, COMPLAINT, GATE_LOG
    title: str
    description: str
    timestamp: datetime
    status_tag: Optional[str] = None
