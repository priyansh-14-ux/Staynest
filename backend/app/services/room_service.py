from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.hostel import Hostel, Block, Floor, Room, Bed, BedStatus, RoomType
from app.models.allocation import Allocation, AllocationStatus
from app.models.resident import Resident
from app.models.user import User
from app.schemas.hostel import (
    HostelCreate, BlockCreate, FloorCreate, RoomCreate, RoomUpdate,
    BedCreate, BedGridItem, RoomGridItem, FloorGridItem, BlockGridItem
)

class RoomService:
    @staticmethod
    def get_all_hostels(db: Session) -> List[Hostel]:
        return db.query(Hostel).all()

    @staticmethod
    def create_hostel(db: Session, data: HostelCreate) -> Hostel:
        hostel = Hostel(**data.model_dump())
        db.add(hostel)
        db.commit()
        db.refresh(hostel)
        return hostel

    @staticmethod
    def get_blocks_by_hostel(db: Session, hostel_id: Optional[int] = None) -> List[Block]:
        query = db.query(Block)
        if hostel_id:
            query = query.filter(Block.hostel_id == hostel_id)
        return query.all()

    @staticmethod
    def create_block(db: Session, data: BlockCreate) -> Block:
        block = Block(**data.model_dump())
        db.add(block)
        db.commit()
        db.refresh(block)
        
        # Auto-create floors if total_floors > 0
        for f in range(data.total_floors):
            floor_name = "Ground Floor" if f == 0 else f"{f}st Floor" if f == 1 else f"{f}nd Floor" if f == 2 else f"{f}th Floor"
            floor = Floor(block_id=block.id, floor_number=f, floor_name=floor_name)
            db.add(floor)
        db.commit()
        db.refresh(block)
        return block

    @staticmethod
    def create_room(db: Session, data: RoomCreate) -> Room:
        existing = db.query(Room).filter(
            Room.floor_id == data.floor_id,
            Room.room_number == data.room_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Room {data.room_number} already exists on this floor"
            )
        
        room = Room(**data.model_dump())
        db.add(room)
        db.commit()
        db.refresh(room)

        # Auto provision beds according to capacity
        for i in range(1, room.capacity + 1):
            bed_num = f"Bed-{i}" if room.capacity <= 4 else f"B-{i}"
            bed = Bed(room_id=room.id, bed_number=bed_num, status=BedStatus.AVAILABLE)
            db.add(bed)
        db.commit()
        db.refresh(room)
        return room

    @staticmethod
    def get_rooms(
        db: Session, 
        block_id: Optional[int] = None, 
        floor_id: Optional[int] = None,
        room_type: Optional[RoomType] = None,
        status_filter: Optional[str] = None
    ) -> List[Room]:
        query = db.query(Room).options(joinedload(Room.beds))
        if floor_id:
            query = query.filter(Room.floor_id == floor_id)
        elif block_id:
            query = query.join(Floor).filter(Floor.block_id == block_id)
        
        if room_type:
            query = query.filter(Room.room_type == room_type)
        
        rooms = query.all()
        return rooms

    @staticmethod
    def get_visual_grid(db: Session, hostel_id: Optional[int] = None) -> List[BlockGridItem]:
        """Builds hierarchical matrix for the interactive visual bed grid."""
        blocks_query = db.query(Block)
        if hostel_id:
            blocks_query = blocks_query.filter(Block.hostel_id == hostel_id)
        blocks = blocks_query.all()

        grid: List[BlockGridItem] = []

        # Fetch all active allocations with resident data
        active_allocations = db.query(Allocation).filter(
            Allocation.status == AllocationStatus.ACTIVE
        ).all()
        alloc_map = {alloc.bed_id: alloc for alloc in active_allocations}

        for block in blocks:
            floor_items: List[FloorGridItem] = []
            for floor in block.floors:
                room_items: List[RoomGridItem] = []
                for room in floor.rooms:
                    bed_items: List[BedGridItem] = []
                    occupied_cnt = 0
                    avail_cnt = 0

                    for bed in room.beds:
                        alloc = alloc_map.get(bed.id)
                        res_name = None
                        res_reg = None
                        res_id = None
                        res_course = None

                        if alloc and alloc.resident:
                            res_id = alloc.resident.id
                            res_name = alloc.resident.user.full_name if alloc.resident.user else "Student"
                            res_reg = alloc.resident.registration_number
                            res_course = alloc.resident.course

                        if bed.status == BedStatus.OCCUPIED:
                            occupied_cnt += 1
                        elif bed.status == BedStatus.AVAILABLE:
                            avail_cnt += 1

                        bed_items.append(BedGridItem(
                            bed_id=bed.id,
                            bed_number=bed.bed_number,
                            status=bed.status,
                            resident_id=res_id,
                            resident_name=res_name,
                            registration_number=res_reg,
                            course=res_course
                        ))

                    room_items.append(RoomGridItem(
                        room_id=room.id,
                        room_number=room.room_number,
                        room_type=room.room_type,
                        capacity=room.capacity,
                        occupied_count=occupied_cnt,
                        available_count=avail_cnt,
                        monthly_rate=room.monthly_rate,
                        has_ac=room.has_air_conditioner,
                        has_attached_bath=room.has_attached_bathroom,
                        beds=bed_items
                    ))
                floor_items.append(FloorGridItem(
                    floor_id=floor.id,
                    floor_number=floor.floor_number,
                    floor_name=floor.floor_name,
                    rooms=room_items
                ))
            grid.append(BlockGridItem(
                block_id=block.id,
                block_name=block.name,
                gender=block.gender,
                floors=floor_items
            ))

        return grid
