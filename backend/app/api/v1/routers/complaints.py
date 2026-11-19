from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.complaint import ComplaintCategory, ComplaintStatus
from app.schemas.complaint import ComplaintCreate, ComplaintAssign, ComplaintStatusUpdate, ComplaintOut
from app.services.complaint_service import ComplaintService

router = APIRouter(prefix="/complaints", tags=["Complaints & Maintenance"])

@router.get("", response_model=List[ComplaintOut])
def get_complaints(
    resident_id: Optional[int] = None,
    category: Optional[ComplaintCategory] = None,
    status_filter: Optional[ComplaintStatus] = None,
    db: Session = Depends(get_db)
):
    return ComplaintService.get_complaints(db, resident_id, category, status_filter)

@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def file_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.STUDENT:
        if not current_user.resident_profile:
            raise HTTPException(status_code=400, detail="User has no resident profile")
        resident_id = current_user.resident_profile.id
    else:
        # Default to first resident if admin filing on behalf
        res = current_user.resident_profile
        resident_id = res.id if res else 1

    return ComplaintService.create_complaint(db, resident_id, data)

@router.patch("/{complaint_id}/assign", response_model=ComplaintOut)
def assign_complaint(
    complaint_id: int,
    data: ComplaintAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    return ComplaintService.assign_complaint(db, complaint_id, data)

@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
def update_complaint_status(
    complaint_id: int,
    data: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.MAINTENANCE]))
):
    return ComplaintService.update_complaint_status(db, complaint_id, data)
