import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user import User, UserRole
from app.models.hostel import Bed, Room, Floor, Block
from app.models.allocation import Allocation, AllocationStatus
from app.models.fee import FeeInvoice
from app.services.fee_service import FeeService

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/occupancy/csv")
def export_occupancy_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.ACCOUNTANT]))
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Hostel", "Block", "Floor", "Room Number", "Room Type", "Bed Number", "Bed Status", "Resident Name", "Reg Number"])

    beds = db.query(Bed).join(Room).join(Floor).join(Block).all()
    active_allocs = {a.bed_id: a for a in db.query(Allocation).filter(Allocation.status == AllocationStatus.ACTIVE).all()}

    for b in beds:
        room = b.room
        floor = room.floor
        block = floor.block
        hostel = block.hostel
        alloc = active_allocs.get(b.id)
        res_name = alloc.resident.user.full_name if (alloc and alloc.resident and alloc.resident.user) else "Vacant"
        reg_no = alloc.resident.registration_number if (alloc and alloc.resident) else "N/A"

        writer.writerow([
            hostel.name,
            block.name,
            floor.floor_name,
            room.room_number,
            room.room_type.value,
            b.bed_number,
            b.status.value,
            res_name,
            reg_no
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hostel_occupancy_report.csv"}
    )

@router.get("/fees/csv")
def export_fees_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.ACCOUNTANT]))
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Invoice Number", "Student Name", "Reg Number", "Title", "Period", "Total Amount", "Paid Amount", "Remaining Due", "Due Date", "Status"])

    invoices = db.query(FeeInvoice).all()
    for inv in invoices:
        r = inv.resident
        name = r.user.full_name if (r and r.user) else "Student"
        reg = r.registration_number if r else "N/A"

        writer.writerow([
            inv.invoice_number,
            name,
            reg,
            inv.title,
            inv.billing_period,
            f"{inv.total_amount:.2f}",
            f"{inv.paid_amount:.2f}",
            f"{inv.remaining_due:.2f}",
            inv.due_date.isoformat(),
            inv.status.value
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hostel_fee_collections_report.csv"}
    )

@router.get("/defaulters/csv")
def export_defaulters_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.ACCOUNTANT]))
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student Name", "Reg Number", "Room", "Phone", "Guardian Phone", "Total Invoiced", "Total Paid", "Total Overdue", "Overdue Invoices Count"])

    defaulters = FeeService.get_defaulters(db)
    for d in defaulters:
        writer.writerow([
            d.student_name,
            d.registration_number,
            d.room_number or "N/A",
            d.phone or "N/A",
            d.guardian_phone,
            f"{d.total_invoiced:.2f}",
            f"{d.total_paid:.2f}",
            f"{d.total_overdue:.2f}",
            d.overdue_invoices_count
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hostel_fee_defaulters_report.csv"}
    )
