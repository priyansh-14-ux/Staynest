from datetime import date, datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session
from app.models.hostel import Hostel, Block, Floor, Room, Bed, BedStatus, RoomType
from app.models.resident import Resident, ResidentStatus
from app.models.allocation import Allocation, AllocationStatus
from app.models.fee import FeeInvoice, Payment, InvoiceStatus
from app.models.leave import LeaveRequest, LeaveStatus, GateLog, GatePass
from app.models.complaint import Complaint, ComplaintStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.analytics import (
    DashboardStatsOut, BlockOccupancyData, RoomTypeDistributionData,
    MonthlyRevenueData, ActivityItem
)

class AnalyticsService:
    @staticmethod
    def get_dashboard_stats(db: Session) -> DashboardStatsOut:
        total_hostels = db.query(Hostel).count()
        total_blocks = db.query(Block).count()
        total_rooms = db.query(Room).count()
        total_beds = db.query(Bed).count()
        
        occupied_beds = db.query(Bed).filter(Bed.status == BedStatus.OCCUPIED).count()
        available_beds = db.query(Bed).filter(Bed.status == BedStatus.AVAILABLE).count()
        maintenance_beds = db.query(Bed).filter(Bed.status == BedStatus.MAINTENANCE).count()
        
        occ_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

        total_active_students = db.query(Resident).filter(Resident.status == ResidentStatus.ACTIVE).count()
        pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).count()
        open_complaints = db.query(Complaint).filter(Complaint.status.in_([ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS])).count()

        invoices = db.query(FeeInvoice).all()
        total_billed = sum(i.total_amount for i in invoices)
        total_collected = sum(i.paid_amount for i in invoices)
        total_dues = sum(i.remaining_due for i in invoices)

        today = date.today()
        defaulters_cnt = len(set(
            i.resident_id for i in invoices
            if i.remaining_due > 0 and i.due_date < today
        ))

        today_records = db.query(Attendance).filter(Attendance.date == today).all()
        pres_cnt = sum(1 for a in today_records if a.status == AttendanceStatus.PRESENT)
        abs_cnt = sum(1 for a in today_records if a.status == AttendanceStatus.ABSENT)
        leave_cnt = sum(1 for a in today_records if a.status == AttendanceStatus.ON_LEAVE)

        return DashboardStatsOut(
            total_hostels=total_hostels,
            total_blocks=total_blocks,
            total_rooms=total_rooms,
            total_beds=total_beds,
            occupied_beds=occupied_beds,
            available_beds=available_beds,
            maintenance_beds=maintenance_beds,
            occupancy_rate=occ_rate,
            total_active_students=total_active_students,
            pending_leaves_count=pending_leaves,
            open_complaints_count=open_complaints,
            total_fees_billed=total_billed,
            total_fees_collected=total_collected,
            total_pending_dues=total_dues,
            defaulters_count=defaulters_cnt,
            today_present_count=pres_cnt,
            today_absent_count=abs_cnt,
            today_on_leave_count=leave_cnt
        )

    @staticmethod
    def get_block_occupancy(db: Session) -> List[BlockOccupancyData]:
        blocks = db.query(Block).all()
        results = []
        for b in blocks:
            beds = db.query(Bed).join(Room).join(Floor).filter(Floor.block_id == b.id).all()
            tot = len(beds)
            occ = sum(1 for bed in beds if bed.status == BedStatus.OCCUPIED)
            avail = sum(1 for bed in beds if bed.status == BedStatus.AVAILABLE)
            pct = round((occ / tot * 100), 1) if tot > 0 else 0.0

            results.append(BlockOccupancyData(
                block_name=b.name,
                total_beds=tot,
                occupied_beds=occ,
                available_beds=avail,
                occupancy_percentage=pct
            ))
        return results

    @staticmethod
    def get_room_type_distribution(db: Session) -> List[RoomTypeDistributionData]:
        rooms = db.query(Room).all()
        type_map = {}
        for r in rooms:
            t = r.room_type.value
            if t not in type_map:
                type_map[t] = {"count": 0, "occupied": 0}
            type_map[t]["count"] += r.capacity
            occ = sum(1 for b in r.beds if b.status == BedStatus.OCCUPIED)
            type_map[t]["occupied"] += occ

        return [
            RoomTypeDistributionData(
                room_type=k.replace("_", " "),
                count=v["count"],
                occupied=v["occupied"]
            )
            for k, v in type_map.items()
        ]

    @staticmethod
    def get_recent_activities(db: Session, limit: int = 15) -> List[ActivityItem]:
        activities: List[ActivityItem] = []

        # 1. Recent Payments
        payments = db.query(Payment).order_by(Payment.payment_date.desc()).limit(5).all()
        for p in payments:
            name = p.resident.user.full_name if (p.resident and p.resident.user) else "Student"
            activities.append(ActivityItem(
                id=f"PAY-{p.id}",
                type="PAYMENT",
                title=f"Fee Payment: ₹{p.amount:,.0f}",
                description=f"{name} paid via {p.payment_method.value} ({p.receipt_number})",
                timestamp=p.payment_date,
                status_tag="SUCCESS"
            ))

        # 2. Recent Complaints
        complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).limit(5).all()
        for c in complaints:
            name = c.resident.user.full_name if (c.resident and c.resident.user) else "Student"
            activities.append(ActivityItem(
                id=f"CMP-{c.id}",
                type="COMPLAINT",
                title=f"Complaint: {c.title}",
                description=f"Filed by {name} ({c.category.value})",
                timestamp=c.created_at,
                status_tag=c.status.value
            ))

        # 3. Recent Gate Logs
        gate_logs = db.query(GateLog).order_by(GateLog.timestamp.desc()).limit(5).all()
        for gl in gate_logs:
            gp = gl.gate_pass
            res_name = gp.resident.user.full_name if (gp and gp.resident and gp.resident.user) else "Resident"
            activities.append(ActivityItem(
                id=f"GL-{gl.id}",
                type="GATE_LOG",
                title=f"Gate {gl.action.value}: {res_name}",
                description=f"Logged by {gl.security_officer_name} ({gl.remarks or 'Normal'})",
                timestamp=gl.timestamp,
                status_tag=gl.action.value
            ))

        # 4. Recent Allocations
        allocs = db.query(Allocation).order_by(Allocation.created_at.desc()).limit(5).all()
        for a in allocs:
            res_name = a.resident.user.full_name if (a.resident and a.resident.user) else "Student"
            bed_num = a.bed.bed_number if a.bed else "Bed"
            room_num = a.bed.room.room_number if (a.bed and a.bed.room) else "Room"
            activities.append(ActivityItem(
                id=f"ALC-{a.id}",
                type="ALLOCATION",
                title=f"Bed Allocated: {room_num} ({bed_num})",
                description=f"Assigned to {res_name} for session {a.academic_year}",
                timestamp=a.created_at,
                status_tag=a.status.value
            ))

        activities.sort(key=lambda x: x.timestamp, reverse=True)
        return activities[:limit]
