from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.fee import InvoiceStatus
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureOut, FeeInvoiceCreate, FeeInvoiceBatchCreate,
    FeeInvoiceOut, PaymentCreate, PaymentOut, ReceiptOut, DefaulterOut
)
from app.services.fee_service import FeeService

router = APIRouter(prefix="/fees", tags=["Fees & Payments"])

@router.get("/structures", response_model=List[FeeStructureOut])
def get_fee_structures(db: Session = Depends(get_db)):
    return FeeService.get_fee_structures(db)

@router.post("/structures", response_model=FeeStructureOut, status_code=status.HTTP_201_CREATED)
def create_fee_structure(
    data: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.ACCOUNTANT]))
):
    return FeeService.create_fee_structure(db, data)

@router.get("/invoices", response_model=List[FeeInvoiceOut])
def get_invoices(
    resident_id: Optional[int] = None,
    status_filter: Optional[InvoiceStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return FeeService.get_invoices(db, resident_id, status_filter, search)

@router.post("/invoices/individual", response_model=FeeInvoiceOut, status_code=status.HTTP_201_CREATED)
def create_individual_invoice(
    data: FeeInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.ACCOUNTANT]))
):
    return FeeService.create_individual_invoice(db, data)

@router.post("/invoices/batch", response_model=List[FeeInvoiceOut], status_code=status.HTTP_201_CREATED)
def batch_generate_invoices(
    data: FeeInvoiceBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.ACCOUNTANT]))
):
    return FeeService.batch_generate_invoices(db, data)

@router.post("/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recorder = current_user.full_name or "System User"
    return FeeService.record_payment(db, data, recorded_by_user=recorder)

@router.get("/receipts/{receipt_no}", response_model=ReceiptOut)
def get_receipt(receipt_no: str, db: Session = Depends(get_db)):
    return FeeService.get_receipt(db, receipt_no)

@router.get("/defaulters", response_model=List[DefaulterOut])
def get_defaulters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.ACCOUNTANT]))
):
    return FeeService.get_defaulters(db)
