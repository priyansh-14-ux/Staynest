import random
from datetime import date, datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.fee import FeeStructure, FeeInvoice, Payment, InvoiceStatus, PaymentMethod, PaymentStatus
from app.models.resident import Resident, ResidentStatus
from app.models.allocation import Allocation, AllocationStatus
from app.models.user import User
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureOut, FeeInvoiceCreate, FeeInvoiceBatchCreate,
    FeeInvoiceOut, PaymentCreate, PaymentOut, ReceiptOut, DefaulterOut
)

class FeeService:
    @staticmethod
    def create_fee_structure(db: Session, data: FeeStructureCreate) -> FeeStructure:
        total = data.room_rent + data.mess_fee + data.maintenance_fee + data.caution_deposit
        fs = FeeStructure(
            **data.model_dump(),
            total_amount=total
        )
        db.add(fs)
        db.commit()
        db.refresh(fs)
        return fs

    @staticmethod
    def get_fee_structures(db: Session) -> List[FeeStructure]:
        return db.query(FeeStructure).all()

    @staticmethod
    def create_individual_invoice(db: Session, data: FeeInvoiceCreate) -> FeeInvoiceOut:
        resident = db.query(Resident).filter(Resident.id == data.resident_id).first()
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")

        inv_num = f"INV-{datetime.now().year}-{random.randint(10000, 99999)}"
        invoice = FeeInvoice(
            invoice_number=inv_num,
            resident_id=data.resident_id,
            title=data.title,
            billing_period=data.billing_period,
            total_amount=data.total_amount,
            paid_amount=0.0,
            due_date=data.due_date,
            status=InvoiceStatus.OVERDUE if data.due_date < date.today() else InvoiceStatus.UNPAID
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return FeeService._map_invoice_out(db, invoice)

    @staticmethod
    def batch_generate_invoices(db: Session, data: FeeInvoiceBatchCreate) -> List[FeeInvoiceOut]:
        query = db.query(Resident).filter(Resident.status == ResidentStatus.ACTIVE)
        if data.resident_ids:
            query = query.filter(Resident.id.in_(data.resident_ids))
        residents = query.all()

        structure = None
        amount = 35000.0  # default semester fee
        if data.fee_structure_id:
            structure = db.query(FeeStructure).filter(FeeStructure.id == data.fee_structure_id).first()
            if structure:
                amount = structure.total_amount

        created_invoices = []
        for r in residents:
            inv_num = f"INV-{datetime.now().year}-{random.randint(10000, 99999)}"
            inv = FeeInvoice(
                invoice_number=inv_num,
                resident_id=r.id,
                title=data.title,
                billing_period=data.billing_period,
                total_amount=amount,
                paid_amount=0.0,
                due_date=data.due_date,
                status=InvoiceStatus.OVERDUE if data.due_date < date.today() else InvoiceStatus.UNPAID
            )
            db.add(inv)
            created_invoices.append(inv)

        db.commit()
        return [FeeService._map_invoice_out(db, inv) for inv in created_invoices]

    @staticmethod
    def record_payment(db: Session, data: PaymentCreate, recorded_by_user: Optional[str] = "Accountant") -> PaymentOut:
        invoice = db.query(FeeInvoice).filter(FeeInvoice.id == data.invoice_id).with_for_update().first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        remaining = invoice.remaining_due
        if data.amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

        if data.amount > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Payment amount (₹{data.amount:.2f}) exceeds remaining invoice balance (₹{remaining:.2f})"
            )

        receipt_num = f"REC-{datetime.now().year}-{random.randint(100000, 999999)}"
        tx_ref = data.transaction_ref or f"TXN-{random.randint(1000000, 9999999)}"

        payment = Payment(
            invoice_id=invoice.id,
            resident_id=invoice.resident_id,
            receipt_number=receipt_num,
            amount=data.amount,
            payment_method=data.payment_method,
            transaction_ref=tx_ref,
            status=PaymentStatus.SUCCESS,
            recorded_by=recorded_by_user,
            remarks=data.remarks
        )
        db.add(payment)

        # Update invoice paid amount and status
        invoice.paid_amount += data.amount
        if invoice.paid_amount >= invoice.total_amount:
            invoice.status = InvoiceStatus.PAID
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID

        db.commit()
        db.refresh(payment)

        res = invoice.resident
        return PaymentOut(
            id=payment.id,
            invoice_id=payment.invoice_id,
            resident_id=payment.resident_id,
            resident_name=res.user.full_name if res.user else "Student",
            receipt_number=payment.receipt_number,
            amount=payment.amount,
            payment_method=payment.payment_method,
            transaction_ref=payment.transaction_ref,
            status=payment.status,
            payment_date=payment.payment_date,
            recorded_by=payment.recorded_by,
            remarks=payment.remarks
        )

    @staticmethod
    def get_invoices(
        db: Session,
        resident_id: Optional[int] = None,
        status_filter: Optional[InvoiceStatus] = None,
        search: Optional[str] = None
    ) -> List[FeeInvoiceOut]:
        query = db.query(FeeInvoice).join(Resident).join(User)
        if resident_id:
            query = query.filter(FeeInvoice.resident_id == resident_id)
        if status_filter:
            query = query.filter(FeeInvoice.status == status_filter)
        if search:
            query = query.filter(
                (FeeInvoice.invoice_number.ilike(f"%{search}%")) |
                (User.full_name.ilike(f"%{search}%")) |
                (Resident.registration_number.ilike(f"%{search}%"))
            )

        invoices = query.order_by(FeeInvoice.created_at.desc()).all()
        return [FeeService._map_invoice_out(db, inv) for inv in invoices]

    @staticmethod
    def get_defaulters(db: Session) -> List[DefaulterOut]:
        """Returns residents with overdue invoices or outstanding balances."""
        today = date.today()
        residents = db.query(Resident).filter(Resident.status == ResidentStatus.ACTIVE).all()
        
        defaulters = []
        for r in residents:
            invoices = db.query(FeeInvoice).filter(FeeInvoice.resident_id == r.id).all()
            total_invoiced = sum(i.total_amount for i in invoices)
            total_paid = sum(i.paid_amount for i in invoices)
            overdue_invs = [i for i in invoices if i.remaining_due > 0 and (i.due_date < today or i.status == InvoiceStatus.OVERDUE)]
            total_overdue = sum(i.remaining_due for i in overdue_invs)

            if total_overdue > 0:
                # Find room
                alloc = db.query(Allocation).filter(
                    Allocation.resident_id == r.id,
                    Allocation.status == AllocationStatus.ACTIVE
                ).first()
                room_no = alloc.bed.room.room_number if (alloc and alloc.bed) else "Unallocated"

                defaulters.append(DefaulterOut(
                    resident_id=r.id,
                    student_name=r.user.full_name if r.user else "Student",
                    registration_number=r.registration_number,
                    phone=r.user.phone if r.user else None,
                    guardian_phone=r.guardian_phone,
                    room_number=room_no,
                    total_invoiced=total_invoiced,
                    total_paid=total_paid,
                    total_overdue=total_overdue,
                    overdue_invoices_count=len(overdue_invs)
                ))

        return sorted(defaulters, key=lambda d: d.total_overdue, reverse=True)

    @staticmethod
    def get_receipt(db: Session, receipt_number: str) -> ReceiptOut:
        payment = db.query(Payment).filter(Payment.receipt_number == receipt_number).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Receipt not found")

        invoice = payment.invoice
        resident = invoice.resident
        alloc = db.query(Allocation).filter(
            Allocation.resident_id == resident.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()

        room_str = alloc.bed.room.room_number if (alloc and alloc.bed) else "N/A"
        block_str = alloc.bed.room.floor.block.name if (alloc and alloc.bed) else "N/A"

        return ReceiptOut(
            receipt_number=payment.receipt_number,
            payment_date=payment.payment_date,
            student_name=resident.user.full_name if resident.user else "Student",
            registration_number=resident.registration_number,
            room_number=room_str,
            hostel_block=block_str,
            invoice_number=invoice.invoice_number,
            invoice_title=invoice.title,
            amount_paid=payment.amount,
            payment_method=payment.payment_method,
            transaction_ref=payment.transaction_ref,
            remaining_invoice_due=invoice.remaining_due,
            recorded_by=payment.recorded_by
        )

    @staticmethod
    def _map_invoice_out(db: Session, inv: FeeInvoice) -> FeeInvoiceOut:
        r = inv.resident
        alloc = db.query(Allocation).filter(
            Allocation.resident_id == r.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()
        room_no = alloc.bed.room.room_number if (alloc and alloc.bed) else None

        payment_outs = [
            PaymentOut(
                id=p.id,
                invoice_id=p.invoice_id,
                resident_id=p.resident_id,
                resident_name=r.user.full_name if r.user else "Student",
                receipt_number=p.receipt_number,
                amount=p.amount,
                payment_method=p.payment_method,
                transaction_ref=p.transaction_ref,
                status=p.status,
                payment_date=p.payment_date,
                recorded_by=p.recorded_by,
                remarks=p.remarks
            )
            for p in inv.payments
        ]

        return FeeInvoiceOut(
            id=inv.id,
            invoice_number=inv.invoice_number,
            resident_id=r.id,
            resident_name=r.user.full_name if r.user else "Student",
            registration_number=r.registration_number,
            room_number=room_no,
            title=inv.title,
            billing_period=inv.billing_period,
            total_amount=inv.total_amount,
            paid_amount=inv.paid_amount,
            remaining_due=inv.remaining_due,
            due_date=inv.due_date,
            status=inv.status,
            created_at=inv.created_at,
            payments=payment_outs
        )
