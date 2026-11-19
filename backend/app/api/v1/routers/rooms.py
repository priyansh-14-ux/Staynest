from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.hostel import Room, RoomType
from app.schemas.hostel import RoomCreate, RoomUpdate, RoomOut, BlockGridItem
from app.services.room_service import RoomService

router = APIRouter(prefix="/rooms", tags=["Rooms & Beds"])

@router.get("/grid", response_model=List[BlockGridItem])
def get_visual_room_grid(
    hostel_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Returns the visual hierarchy matrix for the interactive bed allocation grid."""
    return RoomService.get_visual_grid(db, hostel_id)

@router.get("", response_model=List[RoomOut])
def get_rooms(
    block_id: Optional[int] = None,
    floor_id: Optional[int] = None,
    room_type: Optional[RoomType] = None,
    db: Session = Depends(get_db)
):
    return RoomService.get_rooms(db, block_id, floor_id, room_type)

@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    return RoomService.create_room(db, data)

@router.get("/{room_id}", response_model=RoomOut)
def get_room_details(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room
