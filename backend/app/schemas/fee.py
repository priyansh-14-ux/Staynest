from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.fee import FeeFrequency, InvoiceStatus, PaymentMethod, PaymentStatus

class FeeStructureBase(BaseModel):
    name: str
    room_type: str
    room_rent: float
    mess_fee: float = 0.0
    maintenance_fee: float = 0.0
    caution_deposit: float = 0.0
    frequency: FeeFrequency = FeeFrequency.SEMESTER
    academic_year: str = "2026-2027"

class FeeStructureCreate(FeeStructureBase):
    pass

class FeeStructureOut(FeeStructureBase):
    id: int
    total_amount: float
    created_at: datetime

    class Config:
        from_attributes = True

class FeeInvoiceCreate(BaseModel):
    resident_id: int
    title: str
    billing_period: str
    total_amount: float
    due_date: date

class FeeInvoiceBatchCreate(BaseModel):
    title: str
    billing_period: str
    fee_structure_id: Optional[int] = None
    due_date: date
    resident_ids: Optional[List[int]] = None  # None means all active residents

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: PaymentMethod = PaymentMethod.UPI
    transaction_ref: Optional[str] = None
    remarks: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    resident_id: int
    resident_name: str
    receipt_number: str
    amount: float
    payment_method: PaymentMethod
    transaction_ref: Optional[str] = None
    status: PaymentStatus
    payment_date: datetime
    recorded_by: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class FeeInvoiceOut(BaseModel):
    id: int
    invoice_number: str
    resident_id: int
    resident_name: str
    registration_number: str
    room_number: Optional[str] = None
    title: str
    billing_period: str
    total_amount: float
    paid_amount: float
    remaining_due: float
    due_date: date
    status: InvoiceStatus
    created_at: datetime
    payments: List[PaymentOut] = []

    class Config:
        from_attributes = True

class ReceiptOut(BaseModel):
    receipt_number: str
    payment_date: datetime
    student_name: str
    registration_number: str
    room_number: Optional[str] = None
    hostel_block: Optional[str] = None
    invoice_number: str
    invoice_title: str
    amount_paid: float
    payment_method: PaymentMethod
    transaction_ref: Optional[str] = None
    remaining_invoice_due: float
    recorded_by: str

class DefaulterOut(BaseModel):
    resident_id: int
    student_name: str
    registration_number: str
    phone: Optional[str] = None
    guardian_phone: str
    room_number: Optional[str] = None
    total_invoiced: float
    total_paid: float
    total_overdue: float
    overdue_invoices_count: int
