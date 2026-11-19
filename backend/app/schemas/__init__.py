from app.schemas.user import UserCreate, UserUpdate, UserOut, LoginRequest, TokenResponse
from app.schemas.hostel import HostelCreate, HostelOut, BlockCreate, BlockOut, FloorCreate, FloorOut, RoomCreate, RoomUpdate, RoomOut, BedCreate, BedOut, BedGridItem, RoomGridItem, FloorGridItem, BlockGridItem
from app.schemas.resident import ResidentCreate, ResidentUpdate, ResidentOut, ResidentDetailOut
from app.schemas.allocation import AllocationCreate, AllocationTransfer, AllocationVacate, AllocationOut
from app.schemas.fee import FeeStructureCreate, FeeStructureOut, FeeInvoiceCreate, FeeInvoiceBatchCreate, FeeInvoiceOut, PaymentCreate, PaymentOut, ReceiptOut, DefaulterOut
from app.schemas.leave import LeaveRequestCreate, LeaveReview, LeaveRequestOut, GatePassOut, GateLogCreate, GateLogOut, GatePassVerificationOut
from app.schemas.complaint import ComplaintCreate, ComplaintAssign, ComplaintStatusUpdate, ComplaintOut
from app.schemas.attendance import AttendanceMarkItem, AttendanceBulkCreate, AttendanceOut, AttendanceRegisterRow
from app.schemas.visitor import VisitorCreate, VisitorCheckOut, VisitorOut
from app.schemas.notice import NoticeCreate, NoticeOut
from app.schemas.mess import MessMenuCreate, MessMenuOut
from app.schemas.analytics import DashboardStatsOut, BlockOccupancyData, RoomTypeDistributionData, MonthlyRevenueData, ActivityItem

__all__ = [
    "UserCreate", "UserUpdate", "UserOut", "LoginRequest", "TokenResponse",
    "HostelCreate", "HostelOut", "BlockCreate", "BlockOut", "FloorCreate", "FloorOut", "RoomCreate", "RoomUpdate", "RoomOut", "BedCreate", "BedOut", "BedGridItem", "RoomGridItem", "FloorGridItem", "BlockGridItem",
    "ResidentCreate", "ResidentUpdate", "ResidentOut", "ResidentDetailOut",
    "AllocationCreate", "AllocationTransfer", "AllocationVacate", "AllocationOut",
    "FeeStructureCreate", "FeeStructureOut", "FeeInvoiceCreate", "FeeInvoiceBatchCreate", "FeeInvoiceOut", "PaymentCreate", "PaymentOut", "ReceiptOut", "DefaulterOut",
    "LeaveRequestCreate", "LeaveReview", "LeaveRequestOut", "GatePassOut", "GateLogCreate", "GateLogOut", "GatePassVerificationOut",
    "ComplaintCreate", "ComplaintAssign", "ComplaintStatusUpdate", "ComplaintOut",
    "AttendanceMarkItem", "AttendanceBulkCreate", "AttendanceOut", "AttendanceRegisterRow",
    "VisitorCreate", "VisitorCheckOut", "VisitorOut",
    "NoticeCreate", "NoticeOut",
    "MessMenuCreate", "MessMenuOut",
    "DashboardStatsOut", "BlockOccupancyData", "RoomTypeDistributionData", "MonthlyRevenueData", "ActivityItem"
]
