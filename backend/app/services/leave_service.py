import uuid
import random
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.leave import LeaveRequest, GatePass, GateLog, LeaveStatus, GatePassStatus, GateAction
from app.models.resident import Resident
from app.models.allocation import Allocation, AllocationStatus
from app.schemas.leave import (
    LeaveRequestCreate, LeaveReview, LeaveRequestOut, GatePassOut,
    GateLogCreate, GateLogOut, GatePassVerificationOut
)

class LeaveService:
    @staticmethod
    def create_leave_request(db: Session, resident_id: int, data: LeaveRequestCreate) -> LeaveRequestOut:
        resident = db.query(Resident).filter(Resident.id == resident_id).first()
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")

        if data.end_time <= data.start_time:
            raise HTTPException(status_code=400, detail="Return time must be after departure time")

        leave = LeaveRequest(
            resident_id=resident.id,
            leave_type=data.leave_type,
            start_time=data.start_time,
            end_time=data.end_time,
            destination=data.destination,
            reason=data.reason,
            emergency_contact=data.emergency_contact or resident.guardian_phone,
            parent_informed=data.parent_informed,
            status=LeaveStatus.PENDING
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)
        return LeaveService._map_leave_out(db, leave)

    @staticmethod
    def review_leave_request(db: Session, leave_id: int, review: LeaveReview, reviewer_name: str) -> LeaveRequestOut:
        leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
        if not leave:
            raise HTTPException(status_code=404, detail="Leave request not found")

        leave.status = review.status
        leave.reviewed_by = reviewer_name
        leave.reviewer_remarks = review.remarks
        leave.reviewed_at = datetime.now(timezone.utc)

        # If approved, generate Gate Pass
        if review.status == LeaveStatus.APPROVED and not leave.gate_pass:
            pass_no = f"GP-{datetime.now().year}-{random.randint(10000, 99999)}"
            qr = str(uuid.uuid4())
            gate_pass = GatePass(
                pass_number=pass_no,
                leave_request_id=leave.id,
                resident_id=leave.resident_id,
                qr_token=qr,
                valid_from=leave.start_time,
                valid_until=leave.end_time,
                status=GatePassStatus.ISSUED
            )
            db.add(gate_pass)

        db.commit()
        db.refresh(leave)
        return LeaveService._map_leave_out(db, leave)

    @staticmethod
    def get_leave_requests(
        db: Session,
        resident_id: Optional[int] = None,
        status_filter: Optional[LeaveStatus] = None
    ) -> List[LeaveRequestOut]:
        query = db.query(LeaveRequest)
        if resident_id:
            query = query.filter(LeaveRequest.resident_id == resident_id)
        if status_filter:
            query = query.filter(LeaveRequest.status == status_filter)

        leaves = query.order_by(LeaveRequest.created_at.desc()).all()
        return [LeaveService._map_leave_out(db, l) for l in leaves]

    @staticmethod
    def verify_gate_pass(db: Session, code_or_token: str) -> GatePassVerificationOut:
        """Looks up pass by Pass Number (e.g. GP-2026-1029) or QR Token."""
        gp = db.query(GatePass).filter(
            (GatePass.pass_number == code_or_token) | (GatePass.qr_token == code_or_token)
        ).first()

        if not gp:
            return GatePassVerificationOut(
                is_valid=False,
                message="Gate Pass not found with provided code or token"
            )

        now = datetime.now(timezone.utc)
        # Note: if using naive datetimes in db, normalize
        is_active_window = True

        res = gp.resident
        alloc = db.query(Allocation).filter(
            Allocation.resident_id == res.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()

        return GatePassVerificationOut(
            is_valid=True,
            message="Valid Gate Pass verified",
            gate_pass=LeaveService._map_gate_pass_out(db, gp),
            student_details={
                "resident_id": res.id,
                "name": res.user.full_name if res.user else "Student",
                "registration_number": res.registration_number,
                "phone": res.user.phone if res.user else None,
                "guardian_phone": res.guardian_phone,
                "room_number": alloc.bed.room.room_number if (alloc and alloc.bed) else "N/A"
            }
        )

    @staticmethod
    def log_gate_action(
        db: Session,
        gate_pass_id: int,
        data: GateLogCreate,
        officer_name: str = "Gate Security Officer"
    ) -> GatePassOut:
        gp = db.query(GatePass).filter(GatePass.id == gate_pass_id).with_for_update().first()
        if not gp:
            raise HTTPException(status_code=404, detail="Gate Pass not found")

        now = datetime.now(timezone.utc)
        if data.action == GateAction.EXIT:
            gp.actual_out_time = now
            gp.status = GatePassStatus.CHECKED_OUT
        elif data.action == GateAction.ENTRY:
            gp.actual_in_time = now
            gp.status = GatePassStatus.CHECKED_IN

        log = GateLog(
            gate_pass_id=gp.id,
            security_officer_name=officer_name,
            action=data.action,
            timestamp=now,
            remarks=data.remarks
        )
        db.add(log)
        db.commit()
        db.refresh(gp)

        return LeaveService._map_gate_pass_out(db, gp)

    @staticmethod
    def get_active_gate_passes(db: Session) -> List[GatePassOut]:
        passes = db.query(GatePass).filter(
            GatePass.status.in_([GatePassStatus.ISSUED, GatePassStatus.CHECKED_OUT])
        ).order_by(GatePass.created_at.desc()).all()
        return [LeaveService._map_gate_pass_out(db, p) for p in passes]

    @staticmethod
    def _map_gate_pass_out(db: Session, gp: GatePass) -> GatePassOut:
        res = gp.resident
        leave = gp.leave_request
        alloc = db.query(Allocation).filter(
            Allocation.resident_id == res.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()

        logs_out = [
            GateLogOut(
                id=l.id,
                gate_pass_id=l.gate_pass_id,
                security_officer_name=l.security_officer_name,
                action=l.action,
                timestamp=l.timestamp,
                remarks=l.remarks
            )
            for l in gp.logs
        ]

        return GatePassOut(
            id=gp.id,
            pass_number=gp.pass_number,
            leave_request_id=gp.leave_request_id,
            resident_id=gp.resident_id,
            resident_name=res.user.full_name if res.user else "Student",
            registration_number=res.registration_number,
            room_number=alloc.bed.room.room_number if (alloc and alloc.bed) else None,
            destination=leave.destination if leave else "Out of campus",
            reason=leave.reason if leave else "Approved Leave",
            qr_token=gp.qr_token,
            valid_from=gp.valid_from,
            valid_until=gp.valid_until,
            status=gp.status,
            actual_out_time=gp.actual_out_time,
            actual_in_time=gp.actual_in_time,
            created_at=gp.created_at,
            logs=logs_out
        )

    @staticmethod
    def _map_leave_out(db: Session, l: LeaveRequest) -> LeaveRequestOut:
        res = l.resident
        alloc = db.query(Allocation).filter(
            Allocation.resident_id == res.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()

        gp_out = LeaveService._map_gate_pass_out(db, l.gate_pass) if l.gate_pass else None

        return LeaveRequestOut(
            id=l.id,
            resident_id=res.id,
            resident_name=res.user.full_name if res.user else "Student",
            registration_number=res.registration_number,
            room_number=alloc.bed.room.room_number if (alloc and alloc.bed) else None,
            leave_type=l.leave_type,
            start_time=l.start_time,
            end_time=l.end_time,
            destination=l.destination,
            reason=l.reason,
            emergency_contact=l.emergency_contact,
            parent_informed=l.parent_informed,
            status=l.status,
            reviewed_by=l.reviewed_by,
            reviewer_remarks=l.reviewer_remarks,
            reviewed_at=l.reviewed_at,
            created_at=l.created_at,
            gate_pass=gp_out
        )
