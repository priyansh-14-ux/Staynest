from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.visitor import Visitor
from app.models.resident import Resident
from app.schemas.visitor import VisitorCreate, VisitorCheckOut, VisitorOut

router = APIRouter(prefix="/visitors", tags=["Visitor Management"])

@router.get("", response_model=List[VisitorOut])
def get_visitors(
    resident_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Visitor)
    if resident_id:
        query = query.filter(Visitor.resident_id == resident_id)
    if search:
        query = query.filter(
            (Visitor.visitor_name.ilike(f"%{search}%")) |
            (Visitor.phone.ilike(f"%{search}%")) |
            (Visitor.id_proof_number.ilike(f"%{search}%"))
        )
    
    visitors = query.order_by(Visitor.check_in_time.desc()).all()
    results = []
    for v in visitors:
        res = v.resident
        room_no = "N/A"
        if res and res.allocations:
            active_a = [a for a in res.allocations if a.status.value == "ACTIVE"]
            if active_a and active_a[0].bed:
                room_no = active_a[0].bed.room.room_number

        results.append(VisitorOut(
            id=v.id,
            resident_id=v.resident_id,
            resident_name=res.user.full_name if (res and res.user) else "Student",
            registration_number=res.registration_number if res else "N/A",
            room_number=room_no,
            visitor_name=v.visitor_name,
            phone=v.phone,
            relationship_to_resident=v.relationship_to_resident,
            id_proof_type=v.id_proof_type,
            id_proof_number=v.id_proof_number,
            purpose=v.purpose,
            check_in_time=v.check_in_time,
            check_out_time=v.check_out_time,
            logged_by=v.logged_by,
            remarks=v.remarks
        ))
    return results

@router.post("", response_model=VisitorOut, status_code=status.HTTP_201_CREATED)
def record_visitor_checkin(
    data: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.SECURITY]))
):
    resident = db.query(Resident).filter(Resident.id == data.resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")

    officer_name = current_user.full_name or "Gate Security"
    visitor = Visitor(
        **data.model_dump(),
        logged_by=officer_name
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    room_no = "N/A"
    active_a = [a for a in resident.allocations if a.status.value == "ACTIVE"]
    if active_a and active_a[0].bed:
        room_no = active_a[0].bed.room.room_number

    return VisitorOut(
        id=visitor.id,
        resident_id=visitor.resident_id,
        resident_name=resident.user.full_name if resident.user else "Student",
        registration_number=resident.registration_number,
        room_number=room_no,
        visitor_name=visitor.visitor_name,
        phone=visitor.phone,
        relationship_to_resident=visitor.relationship_to_resident,
        id_proof_type=visitor.id_proof_type,
        id_proof_number=visitor.id_proof_number,
        purpose=visitor.purpose,
        check_in_time=visitor.check_in_time,
        check_out_time=visitor.check_out_time,
        logged_by=visitor.logged_by,
        remarks=visitor.remarks
    )

@router.patch("/{visitor_id}/checkout", response_model=VisitorOut)
def record_visitor_checkout(
    visitor_id: int,
    data: VisitorCheckOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.SECURITY]))
):
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor entry not found")

    visitor.check_out_time = datetime.now(timezone.utc)
    if data.remarks:
        visitor.remarks = f"{visitor.remarks or ''} [Checkout: {data.remarks}]".strip()

    db.commit()
    db.refresh(visitor)

    res = visitor.resident
    room_no = "N/A"
    if res and res.allocations:
        active_a = [a for a in res.allocations if a.status.value == "ACTIVE"]
        if active_a and active_a[0].bed:
            room_no = active_a[0].bed.room.room_number

    return VisitorOut(
        id=visitor.id,
        resident_id=visitor.resident_id,
        resident_name=res.user.full_name if (res and res.user) else "Student",
        registration_number=res.registration_number if res else "N/A",
        room_number=room_no,
        visitor_name=visitor.visitor_name,
        phone=visitor.phone,
        relationship_to_resident=visitor.relationship_to_resident,
        id_proof_type=visitor.id_proof_type,
        id_proof_number=visitor.id_proof_number,
        purpose=visitor.purpose,
        check_in_time=visitor.check_in_time,
        check_out_time=visitor.check_out_time,
        logged_by=visitor.logged_by,
        remarks=visitor.remarks
    )
