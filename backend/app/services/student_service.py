from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.resident import Resident, ResidentStatus
from app.models.user import User, UserRole
from app.models.allocation import Allocation, AllocationStatus
from app.models.hostel import Bed, Room, Floor, Block, Hostel
from app.models.fee import FeeInvoice, InvoiceStatus
from app.core.security import hash_password
from app.schemas.resident import ResidentCreate, ResidentUpdate, ResidentOut, CurrentRoomInfo, ResidentDetailOut

class StudentService:
    @staticmethod
    def get_students(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[ResidentStatus] = None,
        course_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[ResidentOut], int]:
        query = db.query(Resident).join(User)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (User.full_name.ilike(search_term)) |
                (User.email.ilike(search_term)) |
                (Resident.registration_number.ilike(search_term))
            )
        
        if status_filter:
            query = query.filter(Resident.status == status_filter)
        
        if course_filter:
            query = query.filter(Resident.course.ilike(f"%{course_filter}%"))
        
        total = query.count()
        residents = query.offset(skip).limit(limit).all()

        results = []
        for r in residents:
            # Find active room/bed allocation
            active_alloc = db.query(Allocation).filter(
                Allocation.resident_id == r.id,
                Allocation.status == AllocationStatus.ACTIVE
            ).first()

            curr_room = None
            if active_alloc and active_alloc.bed:
                bed = active_alloc.bed
                room = bed.room
                floor = room.floor
                block = floor.block
                hostel = block.hostel
                curr_room = CurrentRoomInfo(
                    hostel_name=hostel.name,
                    block_name=block.name,
                    floor_name=floor.floor_name,
                    room_number=room.room_number,
                    bed_number=bed.bed_number,
                    room_type=room.room_type.value,
                    bed_id=bed.id,
                    allocation_id=active_alloc.id
                )

            # Calculate total outstanding dues
            invoices = db.query(FeeInvoice).filter(FeeInvoice.resident_id == r.id).all()
            total_dues = sum(inv.remaining_due for inv in invoices)

            results.append(ResidentOut(
                id=r.id,
                user_id=r.user_id,
                full_name=r.user.full_name,
                email=r.user.email,
                phone=r.user.phone,
                registration_number=r.registration_number,
                course=r.course,
                department=r.department,
                year_of_study=r.year_of_study,
                gender=r.gender,
                dob=r.dob,
                blood_group=r.blood_group,
                permanent_address=r.permanent_address,
                guardian_name=r.guardian_name,
                guardian_relation=r.guardian_relation,
                guardian_phone=r.guardian_phone,
                guardian_email=r.guardian_email,
                status=r.status,
                admission_date=r.admission_date,
                avatar_url=r.avatar_url,
                current_room=curr_room,
                total_dues=total_dues
            ))

        return results, total

    @staticmethod
    def get_student_by_id(db: Session, student_id: int) -> ResidentDetailOut:
        resident = db.query(Resident).filter(Resident.id == student_id).first()
        if not resident:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        active_alloc = db.query(Allocation).filter(
            Allocation.resident_id == resident.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()

        curr_room = None
        roommates = []
        if active_alloc and active_alloc.bed:
            bed = active_alloc.bed
            room = bed.room
            floor = room.floor
            block = floor.block
            hostel = block.hostel
            curr_room = CurrentRoomInfo(
                hostel_name=hostel.name,
                block_name=block.name,
                floor_name=floor.floor_name,
                room_number=room.room_number,
                bed_number=bed.bed_number,
                room_type=room.room_type.value,
                bed_id=bed.id,
                allocation_id=active_alloc.id
            )

            # Find roommates in same room
            other_allocs = db.query(Allocation).join(Bed).filter(
                Bed.room_id == room.id,
                Allocation.status == AllocationStatus.ACTIVE,
                Allocation.resident_id != resident.id
            ).all()

            for oa in other_allocs:
                if oa.resident and oa.resident.user:
                    roommates.append({
                        "resident_id": oa.resident.id,
                        "name": oa.resident.user.full_name,
                        "bed_number": oa.bed.bed_number,
                        "phone": oa.resident.user.phone,
                        "course": oa.resident.course
                    })

        invoices = db.query(FeeInvoice).filter(FeeInvoice.resident_id == resident.id).all()
        total_dues = sum(inv.remaining_due for inv in invoices)

        return ResidentDetailOut(
            id=resident.id,
            user_id=resident.user_id,
            full_name=resident.user.full_name,
            email=resident.user.email,
            phone=resident.user.phone,
            registration_number=resident.registration_number,
            course=resident.course,
            department=resident.department,
            year_of_study=resident.year_of_study,
            gender=resident.gender,
            dob=resident.dob,
            blood_group=resident.blood_group,
            permanent_address=resident.permanent_address,
            guardian_name=resident.guardian_name,
            guardian_relation=resident.guardian_relation,
            guardian_phone=resident.guardian_phone,
            guardian_email=resident.guardian_email,
            status=resident.status,
            admission_date=resident.admission_date,
            avatar_url=resident.avatar_url,
            current_room=curr_room,
            total_dues=total_dues,
            roommates=roommates,
            created_at=resident.created_at
        )

    @staticmethod
    def create_student(db: Session, data: ResidentCreate) -> Resident:
        # Check duplicate username/email
        existing_user = db.query(User).filter(
            (User.username == data.username) | (User.email == data.email)
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email or username already exists")
        
        # Check duplicate registration number
        existing_reg = db.query(Resident).filter(Resident.registration_number == data.registration_number).first()
        if existing_reg:
            raise HTTPException(status_code=400, detail=f"Registration number {data.registration_number} already in use")

        # Create user
        user = User(
            email=data.email,
            username=data.username,
            hashed_password=hash_password(data.password or "Hostel@123"),
            full_name=data.full_name,
            phone=data.phone,
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(user)
        db.flush()

        resident = Resident(
            user_id=user.id,
            registration_number=data.registration_number,
            course=data.course,
            department=data.department,
            year_of_study=data.year_of_study,
            gender=data.gender,
            dob=data.dob,
            blood_group=data.blood_group,
            permanent_address=data.permanent_address,
            guardian_name=data.guardian_name,
            guardian_relation=data.guardian_relation,
            guardian_phone=data.guardian_phone,
            guardian_email=data.guardian_email,
            status=ResidentStatus.ACTIVE
        )
        db.add(resident)
        db.commit()
        db.refresh(resident)
        return resident
