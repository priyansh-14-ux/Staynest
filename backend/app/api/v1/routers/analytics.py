from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analytics import (
    DashboardStatsOut, BlockOccupancyData, RoomTypeDistributionData, ActivityItem
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/dashboard-stats", response_model=DashboardStatsOut)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return AnalyticsService.get_dashboard_stats(db)

@router.get("/block-occupancy", response_model=List[BlockOccupancyData])
def get_block_occupancy(db: Session = Depends(get_db)):
    return AnalyticsService.get_block_occupancy(db)

@router.get("/room-types", response_model=List[RoomTypeDistributionData])
def get_room_type_distribution(db: Session = Depends(get_db)):
    return AnalyticsService.get_room_type_distribution(db)

@router.get("/recent-activity", response_model=List[ActivityItem])
def get_recent_activity(db: Session = Depends(get_db)):
    return AnalyticsService.get_recent_activities(db)
