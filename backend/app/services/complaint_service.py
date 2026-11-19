import random
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority
from app.models.resident import Resident
from app.models.allocation import Allocation, AllocationStatus
from app.models.user import User
from app.schemas.complaint import ComplaintCreate, ComplaintAssign, ComplaintStatusUpdate, ComplaintOut

class ComplaintService:
    @staticmethod
    def create_complaint(db: Session, resident_id: int, data: ComplaintCreate) -> ComplaintOut:
        resident = db.query(Resident).filter(Resident.id == resident_id).first()
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")

        # Automatically determine room if not provided
        room_id = data.room_id
        if not room_id:
            alloc = db.query(Allocation).filter(
                Allocation.resident_id == resident.id,
                Allocation.status == AllocationStatus.ACTIVE
            ).first()
            if alloc and alloc.bed:
                room_id = alloc.bed.room_id

        ticket_no = f"TCK-{datetime.now().year}-{random.randint(10000, 99999)}"

        complaint = Complaint(
            ticket_number=ticket_no,
            resident_id=resident.id,
            room_id=room_id,
            category=data.category,
            priority=data.priority,
            title=data.title,
            description=data.description,
            attachment_url=data.attachment_url,
            status=ComplaintStatus.OPEN
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        return ComplaintService._map_complaint_out(db, complaint)

    @staticmethod
    def assign_complaint(db: Session, complaint_id: int, data: ComplaintAssign) -> ComplaintOut:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint ticket not found")

        staff = db.query(User).filter(User.id == data.assigned_to_id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff user not found")

        complaint.assigned_to_id = staff.id
        if complaint.status == ComplaintStatus.OPEN:
            complaint.status = ComplaintStatus.IN_PROGRESS

        db.commit()
        db.refresh(complaint)
        return ComplaintService._map_complaint_out(db, complaint)

    @staticmethod
    def update_complaint_status(db: Session, complaint_id: int, data: ComplaintStatusUpdate) -> ComplaintOut:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint ticket not found")

        complaint.status = data.status
        if data.resolution_notes:
            complaint.resolution_notes = data.resolution_notes

        if data.status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
            complaint.resolved_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(complaint)
        return ComplaintService._map_complaint_out(db, complaint)

    @staticmethod
    def get_complaints(
        db: Session,
        resident_id: Optional[int] = None,
        category: Optional[ComplaintCategory] = None,
        status_filter: Optional[ComplaintStatus] = None,
        assigned_to_id: Optional[int] = None
    ) -> List[ComplaintOut]:
        query = db.query(Complaint)
        if resident_id:
            query = query.filter(Complaint.resident_id == resident_id)
        if category:
            query = query.filter(Complaint.category == category)
        if status_filter:
            query = query.filter(Complaint.status == status_filter)
        if assigned_to_id:
            query = query.filter(Complaint.assigned_to_id == assigned_to_id)

        complaints = query.order_by(Complaint.created_at.desc()).all()
        return [ComplaintService._map_complaint_out(db, c) for c in complaints]

    @staticmethod
    def _map_complaint_out(db: Session, c: Complaint) -> ComplaintOut:
        res = c.resident
        room_no = c.room.room_number if c.room else None

        return ComplaintOut(
            id=c.id,
            ticket_number=c.ticket_number,
            resident_id=c.resident_id,
            resident_name=res.user.full_name if res.user else "Student",
            registration_number=res.registration_number,
            room_number=room_no,
            category=c.category,
            priority=c.priority,
            title=c.title,
            description=c.description,
            attachment_url=c.attachment_url,
            status=c.status,
            assigned_to_id=c.assigned_to_id,
            assigned_to_name=c.assigned_to.full_name if c.assigned_to else None,
            resolution_notes=c.resolution_notes,
            resolved_at=c.resolved_at,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
