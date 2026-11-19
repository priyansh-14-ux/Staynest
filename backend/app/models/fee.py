import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class FeeFrequency(str, enum.Enum):
    MONTHLY = "MONTHLY"
    SEMESTER = "SEMESTER"
    ANNUAL = "ANNUAL"
    ONE_TIME = "ONE_TIME"

class InvoiceStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    NET_BANKING = "NET_BANKING"
    DEMAND_DRAFT = "DEMAND_DRAFT"

class PaymentStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    PENDING = "PENDING"
    FAILED = "FAILED"

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    academic_year = Column(String(50), default="2026-2027", nullable=False)
    name = Column(String(150), nullable=False)  # e.g. "Double AC Room + Mess Plan"
    room_type = Column(String(50), nullable=False)
    room_rent = Column(Float, default=0.0, nullable=False)
    mess_fee = Column(Float, default=0.0, nullable=False)
    maintenance_fee = Column(Float, default=0.0, nullable=False)
    caution_deposit = Column(Float, default=0.0, nullable=False)  # Refundable
    frequency = Column(Enum(FeeFrequency), default=FeeFrequency.SEMESTER, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FeeInvoice(Base):
    __tablename__ = "fee_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(60), unique=True, index=True, nullable=False)  # e.g. "INV-2026-0001"
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False)
    title = Column(String(200), nullable=False)  # e.g. "Odd Semester 2026 Hostel & Mess Fee"
    billing_period = Column(String(100), nullable=False)  # e.g. "July - Dec 2026"
    total_amount = Column(Float, default=0.0, nullable=False)
    paid_amount = Column(Float, default=0.0, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.UNPAID, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    resident = relationship("Resident", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    @property
    def remaining_due(self) -> float:
        return max(0.0, self.total_amount - self.paid_amount)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("fee_invoices.id"), nullable=False)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False)
    receipt_number = Column(String(60), unique=True, index=True, nullable=False)  # e.g. "REC-2026-9041"
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.UPI, nullable=False)
    transaction_ref = Column(String(100), nullable=True)  # Gateway ref or Cheque/DD no.
    status = Column(Enum(PaymentStatus), default=PaymentStatus.SUCCESS, nullable=False)
    payment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    recorded_by = Column(String(150), default="Online / Gateway", nullable=False)
    remarks = Column(Text, nullable=True)

    invoice = relationship("FeeInvoice", back_populates="payments")
    resident = relationship("Resident")
