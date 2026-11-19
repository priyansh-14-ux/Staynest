from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.leave import LeaveStatus
from app.schemas.leave import (
    LeaveRequestCreate, LeaveReview, LeaveRequestOut, GatePassOut,
    GateLogCreate, GatePassVerificationOut
)
from app.services.leave_service import LeaveService

router = APIRouter(prefix="/leaves", tags=["Leaves & Gate Passes"])

@router.get("", response_model=List[LeaveRequestOut])
def get_leave_requests(
    resident_id: Optional[int] = None,
    status_filter: Optional[LeaveStatus] = None,
    db: Session = Depends(get_db)
):
    return LeaveService.get_leave_requests(db, resident_id, status_filter)

@router.post("", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def submit_leave_request(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If student, link to their resident profile
    if current_user.role == UserRole.STUDENT:
        if not current_user.resident_profile:
            raise HTTPException(status_code=400, detail="User has no resident profile")
        resident_id = current_user.resident_profile.id
    else:
        raise HTTPException(status_code=400, detail="Only students can submit leave requests directly")
    
    return LeaveService.create_leave_request(db, resident_id, data)

@router.patch("/{leave_id}/review", response_model=LeaveRequestOut)
def review_leave_request(
    leave_id: int,
    data: LeaveReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    reviewer_name = current_user.full_name or "Warden"
    return LeaveService.review_leave_request(db, leave_id, data, reviewer_name)

@router.get("/gate-passes/active", response_model=List[GatePassOut])
def get_active_gate_passes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.SECURITY]))
):
    return LeaveService.get_active_gate_passes(db)

@router.get("/gate-passes/verify/{code_or_token}", response_model=GatePassVerificationOut)
def verify_gate_pass(
    code_or_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.SECURITY]))
):
    return LeaveService.verify_gate_pass(db, code_or_token)

@router.post("/gate-passes/{gate_pass_id}/log", response_model=GatePassOut)
def log_gate_action(
    gate_pass_id: int,
    data: GateLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.SECURITY]))
):
    officer_name = current_user.full_name or "Security Officer"
    return LeaveService.log_gate_action(db, gate_pass_id, data, officer_name)
