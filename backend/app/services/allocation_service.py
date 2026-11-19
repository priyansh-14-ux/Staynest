from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.allocation import Allocation, AllocationStatus
from app.models.hostel import Bed, BedStatus, Room, Floor, Block, Hostel
from app.models.resident import Resident
from app.schemas.allocation import AllocationCreate, AllocationTransfer, AllocationVacate, AllocationOut

class AllocationService:
    @staticmethod
    def allocate_bed(db: Session, data: AllocationCreate) -> AllocationOut:
        # 1. Check Resident exists
        resident = db.query(Resident).filter(Resident.id == data.resident_id).first()
        if not resident:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resident not found")

        # 2. Check if resident already has an ACTIVE allocation
        existing_alloc = db.query(Allocation).filter(
            Allocation.resident_id == resident.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()
        if existing_alloc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student already has an active bed allocation (Allocation #{existing_alloc.id}). Transfer or vacate first."
            )

        # 3. Check Bed exists and is AVAILABLE
        bed = db.query(Bed).filter(Bed.id == data.bed_id).with_for_update().first()
        if not bed:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed not found")
        
        if bed.status != BedStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bed {bed.bed_number} is not available (Current status: {bed.status.value})"
            )

        # 4. Enforce room capacity constraint
        room = db.query(Room).filter(Room.id == bed.room_id).first()
        occupied_in_room = db.query(Bed).filter(
            Bed.room_id == room.id,
            Bed.status == BedStatus.OCCUPIED
        ).count()
        if occupied_in_room >= room.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Room {room.room_number} capacity ({room.capacity}) has already been reached"
            )

        # 5. Create Allocation & update bed status
        alloc = Allocation(
            resident_id=resident.id,
            bed_id=bed.id,
            academic_year=data.academic_year,
            allocated_from=data.allocated_from or date.today(),
            status=AllocationStatus.ACTIVE,
            remarks=data.remarks
        )
        bed.status = BedStatus.OCCUPIED
        db.add(alloc)
        db.commit()
        db.refresh(alloc)

        return AllocationService._map_to_out(db, alloc)

    @staticmethod
    def transfer_bed(db: Session, data: AllocationTransfer) -> AllocationOut:
        alloc = db.query(Allocation).filter(Allocation.id == data.allocation_id).first()
        if not alloc or alloc.status != AllocationStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active allocation not found")

        new_bed = db.query(Bed).filter(Bed.id == data.new_bed_id).with_for_update().first()
        if not new_bed:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target bed not found")
        
        if new_bed.status != BedStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Target bed {new_bed.bed_number} is not available"
            )

        old_bed = db.query(Bed).filter(Bed.id == alloc.bed_id).first()
        if old_bed:
            old_bed.status = BedStatus.AVAILABLE

        # Mark old allocation as transferred
        alloc.status = AllocationStatus.TRANSFERRED
        alloc.allocated_to = date.today()

        # Create new active allocation
        new_alloc = Allocation(
            resident_id=alloc.resident_id,
            bed_id=new_bed.id,
            academic_year=alloc.academic_year,
            allocated_from=date.today(),
            status=AllocationStatus.ACTIVE,
            remarks=f"Transferred from Bed {old_bed.bed_number if old_bed else 'N/A'}. {data.remarks or ''}".strip()
        )
        new_bed.status = BedStatus.OCCUPIED

        db.add(new_alloc)
        db.commit()
        db.refresh(new_alloc)

        return AllocationService._map_to_out(db, new_alloc)

    @staticmethod
    def vacate_bed(db: Session, data: AllocationVacate) -> AllocationOut:
        alloc = db.query(Allocation).filter(Allocation.id == data.allocation_id).first()
        if not alloc or alloc.status != AllocationStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active allocation not found")

        bed = db.query(Bed).filter(Bed.id == alloc.bed_id).first()
        if bed:
            bed.status = BedStatus.AVAILABLE

        alloc.status = AllocationStatus.VACATED
        alloc.allocated_to = data.vacated_date or date.today()
        if data.remarks:
            alloc.remarks = f"{alloc.remarks or ''} [Vacated: {data.remarks}]".strip()

        db.commit()
        db.refresh(alloc)

        return AllocationService._map_to_out(db, alloc)

    @staticmethod
    def get_allocations(
        db: Session,
        status_filter: Optional[AllocationStatus] = None,
        search: Optional[str] = None
    ) -> List[AllocationOut]:
        query = db.query(Allocation).join(Resident).join(Bed)
        if status_filter:
            query = query.filter(Allocation.status == status_filter)
        
        allocs = query.order_by(Allocation.created_at.desc()).all()
        return [AllocationService._map_to_out(db, a) for a in allocs]

    @staticmethod
    def _map_to_out(db: Session, a: Allocation) -> AllocationOut:
        res = a.resident
        bed = a.bed
        room = bed.room
        floor = room.floor
        block = floor.block
        hostel = block.hostel

        return AllocationOut(
            id=a.id,
            resident_id=res.id,
            resident_name=res.user.full_name if res.user else "Student",
            registration_number=res.registration_number,
            bed_id=bed.id,
            bed_number=bed.bed_number,
            room_number=room.room_number,
            block_name=block.name,
            hostel_name=hostel.name,
            academic_year=a.academic_year,
            allocated_from=a.allocated_from,
            allocated_to=a.allocated_to,
            status=a.status,
            remarks=a.remarks,
            created_at=a.created_at
        )
