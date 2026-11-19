from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.hostel import Hostel, Block, Floor
from app.schemas.hostel import (
    HostelCreate, HostelOut, BlockCreate, BlockOut, FloorCreate, FloorOut
)
from app.services.room_service import RoomService

router = APIRouter(prefix="/hostels", tags=["Hostels & Blocks"])

@router.get("", response_model=List[HostelOut])
def get_hostels(db: Session = Depends(get_db)):
    return RoomService.get_all_hostels(db)

@router.post("", response_model=HostelOut, status_code=status.HTTP_201_CREATED)
def create_hostel(
    data: HostelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    return RoomService.create_hostel(db, data)

@router.get("/blocks", response_model=List[BlockOut])
def get_blocks(hostel_id: Optional[int] = None, db: Session = Depends(get_db)):
    return RoomService.get_blocks_by_hostel(db, hostel_id)

@router.post("/blocks", response_model=BlockOut, status_code=status.HTTP_201_CREATED)
def create_block(
    data: BlockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    return RoomService.create_block(db, data)
