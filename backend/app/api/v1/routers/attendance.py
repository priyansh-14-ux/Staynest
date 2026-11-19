from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.attendance import AttendanceBulkCreate, AttendanceOut, AttendanceRegisterRow
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Attendance Register"])

@router.get("/register", response_model=List[AttendanceRegisterRow])
def get_attendance_register(
    target_date: Optional[date] = None,
    block_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.SECURITY]))
):
    actual_date = target_date or date.today()
    return AttendanceService.get_attendance_register(db, actual_date, block_id)

@router.post("/mark-bulk", response_model=List[AttendanceOut])
def mark_bulk_attendance(
    data: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.SECURITY]))
):
    marker_name = current_user.full_name or "Warden"
    return AttendanceService.mark_bulk_attendance(db, data, marker_name)
