from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.allocation import AllocationStatus
from app.schemas.allocation import AllocationCreate, AllocationTransfer, AllocationVacate, AllocationOut
from app.services.allocation_service import AllocationService

router = APIRouter(prefix="/allocations", tags=["Bed Allocations"])

@router.get("", response_model=List[AllocationOut])
def get_allocations(
    status_filter: Optional[AllocationStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return AllocationService.get_allocations(db, status_filter, search)

@router.post("", response_model=AllocationOut, status_code=status.HTTP_201_CREATED)
def allocate_bed(
    data: AllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    return AllocationService.allocate_bed(db, data)

@router.post("/transfer", response_model=AllocationOut)
def transfer_bed(
    data: AllocationTransfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    return AllocationService.transfer_bed(db, data)

@router.post("/vacate", response_model=AllocationOut)
def vacate_bed(
    data: AllocationVacate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    return AllocationService.vacate_bed(db, data)
