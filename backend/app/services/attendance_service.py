from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.attendance import Attendance, AttendanceStatus
from app.models.resident import Resident, ResidentStatus
from app.models.allocation import Allocation, AllocationStatus
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.hostel import Bed, Room, Floor, Block
from app.schemas.attendance import AttendanceBulkCreate, AttendanceOut, AttendanceRegisterRow

class AttendanceService:
    @staticmethod
    def get_attendance_register(
        db: Session,
        target_date: date,
        block_id: Optional[int] = None
    ) -> List[AttendanceRegisterRow]:
        """Returns the full roster of active residents, their marked status for target_date, and whether they have an approved leave."""
        query = db.query(Resident).join(Allocation).join(Bed).join(Room).join(Floor).filter(
            Resident.status == ResidentStatus.ACTIVE,
            Allocation.status == AllocationStatus.ACTIVE
        )
        if block_id:
            query = query.filter(Floor.block_id == block_id)

        residents = query.all()

        # Find existing attendance marks for target_date
        res_ids = [r.id for r in residents]
        existing_records = db.query(Attendance).filter(
            Attendance.resident_id.in_(res_ids),
            Attendance.date == target_date
        ).all()
        att_map = {a.resident_id: a for a in existing_records}

        # Check approved leaves spanning target_date
        target_dt_start = datetime.combine(target_date, datetime.min.time())
        target_dt_end = datetime.combine(target_date, datetime.max.time())
        active_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.resident_id.in_(res_ids),
            LeaveRequest.status == LeaveStatus.APPROVED,
            LeaveRequest.start_time <= target_dt_end,
            LeaveRequest.end_time >= target_dt_start
        ).all()
        leave_map = {l.resident_id: l for l in active_leaves}

        rows: List[AttendanceRegisterRow] = []
        for r in residents:
            alloc = [a for a in r.allocations if a.status == AllocationStatus.ACTIVE][0]
            room_no = alloc.bed.room.room_number
            block_name = alloc.bed.room.floor.block.name
            
            att = att_map.get(r.id)
            approved_leave = leave_map.get(r.id)

            if att:
                curr_status = att.status
                att_id = att.id
            elif approved_leave:
                curr_status = AttendanceStatus.ON_LEAVE
                att_id = None
            else:
                curr_status = AttendanceStatus.PRESENT
                att_id = None

            rows.append(AttendanceRegisterRow(
                resident_id=r.id,
                resident_name=r.user.full_name if r.user else "Student",
                registration_number=r.registration_number,
                room_number=room_no,
                block_name=block_name,
                status=curr_status,
                has_approved_leave=approved_leave is not None,
                leave_id=approved_leave.id if approved_leave else None,
                attendance_id=att_id
            ))

        return sorted(rows, key=lambda x: (x.block_name, x.room_number))

    @staticmethod
    def mark_bulk_attendance(db: Session, data: AttendanceBulkCreate, marked_by_name: str) -> List[AttendanceOut]:
        results = []
        for item in data.entries:
            record = db.query(Attendance).filter(
                Attendance.resident_id == item.resident_id,
                Attendance.date == data.date
            ).first()

            if record:
                record.status = item.status
                record.remarks = item.remarks
                record.marked_by = marked_by_name
            else:
                record = Attendance(
                    resident_id=item.resident_id,
                    date=data.date,
                    status=item.status,
                    remarks=item.remarks,
                    marked_by=marked_by_name
                )
                db.add(record)

            db.flush()
            res = record.resident
            alloc = db.query(Allocation).filter(
                Allocation.resident_id == res.id,
                Allocation.status == AllocationStatus.ACTIVE
            ).first()
            room_no = alloc.bed.room.room_number if (alloc and alloc.bed) else None

            results.append(AttendanceOut(
                id=record.id,
                resident_id=res.id,
                resident_name=res.user.full_name if res.user else "Student",
                registration_number=res.registration_number,
                room_number=room_no,
                date=record.date,
                status=record.status,
                marked_by=record.marked_by,
                remarks=record.remarks,
                created_at=record.created_at
            ))

        db.commit()
        return results
