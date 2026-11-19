import sys
import os
from datetime import date, datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.hostel import Hostel, Block, Floor, Room, Bed, GenderType, RoomType, BedStatus
from app.models.resident import Resident, ResidentStatus
from app.models.allocation import Allocation, AllocationStatus
from app.models.fee import FeeStructure, FeeInvoice, Payment, FeeFrequency, InvoiceStatus, PaymentMethod, PaymentStatus
from app.models.leave import LeaveRequest, GatePass, GateLog, LeaveType, LeaveStatus, GatePassStatus, GateAction
from app.models.complaint import Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.visitor import Visitor
from app.models.notice import Notice
from app.models.mess import MessMenu

def seed():
    print("Clearing and re-creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding Users...")
        # 1. Staff Users
        admin_user = User(
            email="admin@hostel.edu",
            username="admin",
            hashed_password=hash_password("admin123"),
            full_name="Dr. Vikramaditya Sen",
            phone="+91 98765 43210",
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        warden_user = User(
            email="warden@hostel.edu",
            username="warden",
            hashed_password=hash_password("warden123"),
            full_name="Prof. Rajesh K. Sharma",
            phone="+91 98765 43211",
            role=UserRole.WARDEN,
            is_active=True
        )
        accountant_user = User(
            email="accountant@hostel.edu",
            username="accountant",
            hashed_password=hash_password("accountant123"),
            full_name="Sanjay Singhal",
            phone="+91 98765 43212",
            role=UserRole.ACCOUNTANT,
            is_active=True
        )
        security_user = User(
            email="security@hostel.edu",
            username="security",
            hashed_password=hash_password("security123"),
            full_name="Subedar Ramesh Singh",
            phone="+91 98765 43213",
            role=UserRole.SECURITY,
            is_active=True
        )
        maintenance_user = User(
            email="maintenance@hostel.edu",
            username="maintenance",
            hashed_password=hash_password("tech123"),
            full_name="Manoj Mistri",
            phone="+91 98765 43214",
            role=UserRole.MAINTENANCE,
            is_active=True
        )
        db.add_all([admin_user, warden_user, accountant_user, security_user, maintenance_user])
        db.flush()

        print("Seeding Hostels, Blocks, Floors, Rooms & Beds...")
        # Hostels
        hostel1 = Hostel(
            name="Aryabhata Residential Complex",
            code="ARC",
            address="Campus West Zone, University Enclave",
            contact_phone="+91 11 2345 6789",
            contact_email="aryabhata@hostel.edu"
        )
        hostel2 = Hostel(
            name="Gargi Girls Hall of Residence",
            code="GHR",
            address="Campus North Zone, University Enclave",
            contact_phone="+91 11 2345 6790",
            contact_email="gargi@hostel.edu"
        )
        db.add_all([hostel1, hostel2])
        db.flush()

        # Blocks
        block_a = Block(hostel_id=hostel1.id, name="Block A (Boys Senior Wing)", gender=GenderType.MALE, total_floors=2, warden_id=warden_user.id)
        block_b = Block(hostel_id=hostel1.id, name="Block B (Boys Junior Wing)", gender=GenderType.MALE, total_floors=2, warden_id=warden_user.id)
        block_c = Block(hostel_id=hostel2.id, name="Block C (Girls Wing)", gender=GenderType.FEMALE, total_floors=2, warden_id=warden_user.id)
        db.add_all([block_a, block_b, block_c])
        db.flush()

        # Floors for Block A
        floor_a0 = Floor(block_id=block_a.id, floor_number=0, floor_name="Ground Floor")
        floor_a1 = Floor(block_id=block_a.id, floor_number=1, floor_name="1st Floor")
        # Floors for Block C
        floor_c0 = Floor(block_id=block_c.id, floor_number=0, floor_name="Ground Floor")
        floor_c1 = Floor(block_id=block_c.id, floor_number=1, floor_name="1st Floor")
        db.add_all([floor_a0, floor_a1, floor_c0, floor_c1])
        db.flush()

        # Rooms for Block A Floor 0
        rooms_to_create = [
            (floor_a0.id, "A-101", RoomType.DOUBLE_NON_AC, 2, 6000.0, True, False, "Wi-Fi, Balcony, Study Table"),
            (floor_a0.id, "A-102", RoomType.DOUBLE_AC, 2, 8500.0, True, True, "AC, Wi-Fi, Balcony, Wardrobe"),
            (floor_a0.id, "A-103", RoomType.SINGLE_AC, 1, 11000.0, True, True, "AC, Study Table, Personal Balcony"),
            (floor_a0.id, "A-104", RoomType.TRIPLE, 3, 4500.0, False, False, "Wi-Fi, Study Desk"),
            # Floor 1
            (floor_a1.id, "A-201", RoomType.DOUBLE_NON_AC, 2, 6000.0, True, False, "Wi-Fi, Balcony"),
            (floor_a1.id, "A-202", RoomType.DOUBLE_AC, 2, 8500.0, True, True, "AC, Wi-Fi, Balcony"),
            # Block C Floor 0
            (floor_c0.id, "C-101", RoomType.DOUBLE_AC, 2, 8500.0, True, True, "AC, Wi-Fi, Attached Bathroom"),
            (floor_c0.id, "C-102", RoomType.SINGLE_AC, 1, 11000.0, True, True, "AC, Wi-Fi, Attached Bathroom"),
            # Block C Floor 1
            (floor_c1.id, "C-201", RoomType.DOUBLE_NON_AC, 2, 6000.0, True, False, "Wi-Fi, Balcony, Wardrobe")
        ]

        created_rooms = []
        for fid, rnum, rtype, cap, rate, bath, ac, amen in rooms_to_create:
            r = Room(
                floor_id=fid,
                room_number=rnum,
                room_type=rtype,
                capacity=cap,
                monthly_rate=rate,
                has_attached_bathroom=bath,
                has_air_conditioner=ac,
                amenities=amen
            )
            db.add(r)
            db.flush()
            created_rooms.append(r)
            # Provision beds
            for b_idx in range(1, cap + 1):
                bed = Bed(room_id=r.id, bed_number=f"Bed-{b_idx}", status=BedStatus.AVAILABLE)
                db.add(bed)

        db.flush()

        print("Seeding Student Users & Resident Profiles...")
        student_data = [
            ("aarav.sharma@hostel.edu", "aarav", "Aarav Sharma", "+91 91234 56780", "REG-2026-101", "B.Tech Computer Science", "Male", "O+", "Sunil Sharma", "+91 98111 22233"),
            ("ananya.iyer@hostel.edu", "ananya", "Ananya Iyer", "+91 91234 56781", "REG-2026-102", "B.Tech Electronics & Comm", "Female", "A+", "R. Iyer", "+91 98111 22234"),
            ("rohan.verma@hostel.edu", "rohan", "Rohan Verma", "+91 91234 56782", "REG-2026-103", "B.Tech Mechanical", "Male", "B+", "Deepak Verma", "+91 98111 22235"),
            ("priyansh.keshwani@hostel.edu", "priyansh", "Priyansh Keshwani", "+91 91234 56783", "REG-2026-104", "B.Tech Computer Science", "Male", "B+", "Ashok Keshwani", "+91 98111 22236"),
            ("samriddhi.shrivastava@hostel.edu", "samriddhi", "Samriddhi Shrivastava", "+91 91234 56784", "REG-2026-105", "B.Tech Information Tech", "Female", "AB+", "R. K. Shrivastava", "+91 98111 22237"),
            ("soumya.rathore@hostel.edu", "soumya", "Soumya Rathore", "+91 91234 56785", "REG-2026-106", "B.Tech AI & Data Science", "Female", "O+", "Mahendra Rathore", "+91 98111 22238"),
            ("aditya.nair@hostel.edu", "aditya", "Aditya Nair", "+91 91234 56786", "REG-2026-107", "MBA Tech", "Male", "A-", "Gopal Nair", "+91 98111 22239"),
            ("priya.patel@hostel.edu", "priya", "Priya Patel", "+91 91234 56787", "REG-2026-108", "B.Tech Civil", "Female", "O-", "Hitesh Patel", "+91 98111 22240")
        ]

        created_residents = []
        for email, uname, fname, ph, regno, course, gen, bg, gname, gph in student_data:
            s_user = User(
                email=email,
                username=uname,
                hashed_password=hash_password("student123"),
                full_name=fname,
                phone=ph,
                role=UserRole.STUDENT,
                is_active=True
            )
            db.add(s_user)
            db.flush()

            resident = Resident(
                user_id=s_user.id,
                registration_number=regno,
                course=course,
                department="School of Engineering",
                year_of_study=3 if "Priyansh" in fname or "Samriddhi" in fname or "Soumya" in fname else 2,
                gender=gen,
                dob=date(2004, 5, 14),
                blood_group=bg,
                permanent_address="14/B Model Town, New Delhi, India",
                guardian_name=gname,
                guardian_relation="Father",
                guardian_phone=gph,
                guardian_email=f"parent.{uname}@gmail.com",
                status=ResidentStatus.ACTIVE
            )
            db.add(resident)
            db.flush()
            created_residents.append(resident)

        print("Seeding Bed Allocations...")
        # Allocate Aarav & Priyansh to Room A-101 (Beds 1 & 2)
        room_a101 = [r for r in created_rooms if r.room_number == "A-101"][0]
        beds_a101 = room_a101.beds
        
        alloc1 = Allocation(
            resident_id=created_residents[0].id, # Aarav
            bed_id=beds_a101[0].id,
            academic_year="2026-2027",
            allocated_from=date(2026, 7, 15),
            status=AllocationStatus.ACTIVE,
            remarks="Allocated by Warden during Fall 2026 admission"
        )
        beds_a101[0].status = BedStatus.OCCUPIED

        alloc2 = Allocation(
            resident_id=created_residents[3].id, # Priyansh
            bed_id=beds_a101[1].id,
            academic_year="2026-2027",
            allocated_from=date(2026, 7, 15),
            status=AllocationStatus.ACTIVE,
            remarks="Allocated by Warden during Fall 2026 admission"
        )
        beds_a101[1].status = BedStatus.OCCUPIED

        # Allocate Rohan to A-102 Bed 1
        room_a102 = [r for r in created_rooms if r.room_number == "A-102"][0]
        beds_a102 = room_a102.beds
        alloc3 = Allocation(
            resident_id=created_residents[2].id, # Rohan
            bed_id=beds_a102[0].id,
            academic_year="2026-2027",
            allocated_from=date(2026, 7, 16),
            status=AllocationStatus.ACTIVE
        )
        beds_a102[0].status = BedStatus.OCCUPIED

        # Allocate Aditya to A-103 Bed 1
        room_a103 = [r for r in created_rooms if r.room_number == "A-103"][0]
        beds_a103 = room_a103.beds
        alloc4 = Allocation(
            resident_id=created_residents[6].id, # Aditya
            bed_id=beds_a103[0].id,
            academic_year="2026-2027",
            allocated_from=date(2026, 7, 16),
            status=AllocationStatus.ACTIVE
        )
        beds_a103[0].status = BedStatus.OCCUPIED

        # Allocate Ananya & Samriddhi to Room C-101 (Beds 1 & 2)
        room_c101 = [r for r in created_rooms if r.room_number == "C-101"][0]
        beds_c101 = room_c101.beds
        alloc5 = Allocation(
            resident_id=created_residents[1].id, # Ananya
            bed_id=beds_c101[0].id,
            academic_year="2026-2027",
            allocated_from=date(2026, 7, 15),
            status=AllocationStatus.ACTIVE
        )
        beds_c101[0].status = BedStatus.OCCUPIED

        alloc6 = Allocation(
            resident_id=created_residents[4].id, # Samriddhi
            bed_id=beds_c101[1].id,
            academic_year="2026-2027",
            allocated_from=date(2026, 7, 15),
            status=AllocationStatus.ACTIVE
        )
        beds_c101[1].status = BedStatus.OCCUPIED

        # Allocate Soumya to C-102 Bed 1
        room_c102 = [r for r in created_rooms if r.room_number == "C-102"][0]
        beds_c102 = room_c102.beds
        alloc7 = Allocation(
            resident_id=created_residents[5].id, # Soumya
            bed_id=beds_c102[0].id,
            academic_year="2026-2027",
            allocated_from=date(2026, 7, 15),
            status=AllocationStatus.ACTIVE
        )
        beds_c102[0].status = BedStatus.OCCUPIED

        db.add_all([alloc1, alloc2, alloc3, alloc4, alloc5, alloc6, alloc7])
        db.flush()

        print("Seeding Fee Structures, Invoices & Payments...")
        fs1 = FeeStructure(
            academic_year="2026-2027",
            name="Standard Double Non-AC + Veg Mess",
            room_type="DOUBLE_NON_AC",
            room_rent=36000.0,
            mess_fee=24000.0,
            maintenance_fee=3000.0,
            caution_deposit=5000.0,
            frequency=FeeFrequency.SEMESTER,
            total_amount=68000.0
        )
        fs2 = FeeStructure(
            academic_year="2026-2027",
            name="Premium Single AC + Special Mess",
            room_type="SINGLE_AC",
            room_rent=66000.0,
            mess_fee=28000.0,
            maintenance_fee=5000.0,
            caution_deposit=10000.0,
            frequency=FeeFrequency.SEMESTER,
            total_amount=109000.0
        )
        db.add_all([fs1, fs2])
        db.flush()

        # Invoice 1: Aarav (Fully Paid)
        inv1 = FeeInvoice(
            invoice_number="INV-2026-0001",
            resident_id=created_residents[0].id,
            title="Fall Semester 2026 Hostel & Mess Fee",
            billing_period="July - Dec 2026",
            total_amount=68000.0,
            paid_amount=68000.0,
            due_date=date(2026, 8, 15),
            status=InvoiceStatus.PAID
        )
        db.add(inv1)
        db.flush()
        pay1 = Payment(
            invoice_id=inv1.id,
            resident_id=inv1.resident_id,
            receipt_number="REC-2026-78101",
            amount=68000.0,
            payment_method=PaymentMethod.UPI,
            transaction_ref="UPI/612984920481/OKAXIS",
            status=PaymentStatus.SUCCESS,
            recorded_by="Online Portal",
            payment_date=datetime(2026, 8, 10, 14, 30, tzinfo=timezone.utc)
        )
        db.add(pay1)

        # Invoice 2: Priyansh (Partially Paid)
        inv2 = FeeInvoice(
            invoice_number="INV-2026-0002",
            resident_id=created_residents[3].id,
            title="Fall Semester 2026 Hostel & Mess Fee",
            billing_period="July - Dec 2026",
            total_amount=68000.0,
            paid_amount=40000.0,
            due_date=date(2026, 8, 15),
            status=InvoiceStatus.PARTIALLY_PAID
        )
        db.add(inv2)
        db.flush()
        pay2 = Payment(
            invoice_id=inv2.id,
            resident_id=inv2.resident_id,
            receipt_number="REC-2026-78102",
            amount=40000.0,
            payment_method=PaymentMethod.NET_BANKING,
            transaction_ref="NEFT/HDFC000192849",
            status=PaymentStatus.SUCCESS,
            recorded_by="Sanjay Singhal (Accountant)",
            payment_date=datetime(2026, 8, 12, 11, 15, tzinfo=timezone.utc)
        )
        db.add(pay2)

        # Invoice 3: Rohan (Overdue Defaulter)
        inv3 = FeeInvoice(
            invoice_number="INV-2026-0003",
            resident_id=created_residents[2].id,
            title="Fall Semester 2026 Hostel & Mess Fee",
            billing_period="July - Dec 2026",
            total_amount=68000.0,
            paid_amount=0.0,
            due_date=date(2026, 8, 15),
            status=InvoiceStatus.OVERDUE
        )
        db.add(inv3)

        # Invoice 4: Ananya (Fully Paid)
        inv4 = FeeInvoice(
            invoice_number="INV-2026-0004",
            resident_id=created_residents[1].id,
            title="Fall Semester 2026 Hostel & Mess Fee",
            billing_period="July - Dec 2026",
            total_amount=68000.0,
            paid_amount=68000.0,
            due_date=date(2026, 8, 15),
            status=InvoiceStatus.PAID
        )
        db.add(inv4)
        db.flush()
        pay4 = Payment(
            invoice_id=inv4.id,
            resident_id=inv4.resident_id,
            receipt_number="REC-2026-78103",
            amount=68000.0,
            payment_method=PaymentMethod.CARD,
            transaction_ref="CARD_REF_892348",
            status=PaymentStatus.SUCCESS,
            recorded_by="Online Portal",
            payment_date=datetime(2026, 8, 14, 16, 45, tzinfo=timezone.utc)
        )
        db.add(pay4)
        db.flush()

        print("Seeding Leave Requests & Digital Gate Passes...")
        # Approved Leave with Digital Gate Pass for Aarav Sharma
        leave1 = LeaveRequest(
            resident_id=created_residents[0].id,
            leave_type=LeaveType.HOME_LEAVE,
            start_time=datetime.now(timezone.utc) - timedelta(hours=4),
            end_time=datetime.now(timezone.utc) + timedelta(days=2),
            destination="Delhi (Home)",
            reason="Attending cousin sister's wedding ceremony",
            emergency_contact="+91 98111 22233",
            parent_informed=True,
            status=LeaveStatus.APPROVED,
            reviewed_by="Prof. Rajesh K. Sharma (Warden)",
            reviewer_remarks="Approved. Report back before 9:00 PM on return date.",
            reviewed_at=datetime.now(timezone.utc) - timedelta(hours=5)
        )
        db.add(leave1)
        db.flush()

        gp1 = GatePass(
            pass_number="GP-2026-4012",
            leave_request_id=leave1.id,
            resident_id=leave1.resident_id,
            qr_token="GP-QR-AARAV-4012-TOKEN",
            valid_from=leave1.start_time,
            valid_until=leave1.end_time,
            status=GatePassStatus.CHECKED_OUT,
            actual_out_time=datetime.now(timezone.utc) - timedelta(hours=2)
        )
        db.add(gp1)
        db.flush()

        gate_log1 = GateLog(
            gate_pass_id=gp1.id,
            security_officer_name="Subedar Ramesh Singh",
            action=GateAction.EXIT,
            timestamp=datetime.now(timezone.utc) - timedelta(hours=2),
            remarks="Departed with backpack via Main Gate #1"
        )
        db.add(gate_log1)

        # Pending Leave Request for Samriddhi
        leave2 = LeaveRequest(
            resident_id=created_residents[4].id,
            leave_type=LeaveType.OUTPASS,
            start_time=datetime.now(timezone.utc) + timedelta(hours=2),
            end_time=datetime.now(timezone.utc) + timedelta(hours=6),
            destination="City Center Central Library",
            reason="Reference research books for Final Year Capstone Project",
            emergency_contact="+91 98111 22237",
            parent_informed=True,
            status=LeaveStatus.PENDING
        )
        db.add(leave2)

        print("Seeding Complaints & Maintenance...")
        c1 = Complaint(
            ticket_number="TCK-2026-0041",
            resident_id=created_residents[2].id, # Rohan in A-102
            room_id=room_a102.id,
            category=ComplaintCategory.ELECTRICAL,
            priority=ComplaintPriority.HIGH,
            title="Ceiling fan speed regulator sparking",
            description="The regulator switch sparks when switched to speed 4 or 5. Needs immediate repair.",
            status=ComplaintStatus.IN_PROGRESS,
            assigned_to_id=maintenance_user.id,
            resolution_notes="Inspected on site. Procuring replacement modular regulator."
        )
        c2 = Complaint(
            ticket_number="TCK-2026-0042",
            resident_id=created_residents[1].id, # Ananya in C-101
            room_id=room_c101.id,
            category=ComplaintCategory.PLUMBING,
            priority=ComplaintPriority.MEDIUM,
            title="Washroom faucet leaking continuously",
            description="Continuous dripping from the main wash basin cold water tap.",
            status=ComplaintStatus.OPEN
        )
        c3 = Complaint(
            ticket_number="TCK-2026-0039",
            resident_id=created_residents[3].id, # Priyansh in A-101
            room_id=room_a101.id,
            category=ComplaintCategory.INTERNET,
            priority=ComplaintPriority.LOW,
            title="Corridor Wi-Fi access point reboot loop",
            description="Frequent disconnection in room A-101 Wi-Fi coverage area.",
            status=ComplaintStatus.RESOLVED,
            assigned_to_id=maintenance_user.id,
            resolution_notes="Firmware updated on Aruba AP-505 and channel 6 noise cleared.",
            resolved_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
        db.add_all([c1, c2, c3])

        print("Seeding Daily Attendance...")
        today_date = date.today()
        db.add_all([
            Attendance(resident_id=created_residents[0].id, date=today_date, status=AttendanceStatus.ON_LEAVE, marked_by="System (Approved Gate Pass)", remarks="Home Leave"),
            Attendance(resident_id=created_residents[1].id, date=today_date, status=AttendanceStatus.PRESENT, marked_by="Prof. Rajesh K. Sharma"),
            Attendance(resident_id=created_residents[2].id, date=today_date, status=AttendanceStatus.PRESENT, marked_by="Prof. Rajesh K. Sharma"),
            Attendance(resident_id=created_residents[3].id, date=today_date, status=AttendanceStatus.PRESENT, marked_by="Prof. Rajesh K. Sharma"),
            Attendance(resident_id=created_residents[4].id, date=today_date, status=AttendanceStatus.PRESENT, marked_by="Prof. Rajesh K. Sharma"),
            Attendance(resident_id=created_residents[5].id, date=today_date, status=AttendanceStatus.PRESENT, marked_by="Prof. Rajesh K. Sharma"),
            Attendance(resident_id=created_residents[6].id, date=today_date, status=AttendanceStatus.LATE_ENTRY, marked_by="Subedar Ramesh Singh", remarks="Late return from library"),
        ])

        print("Seeding Visitor Logs...")
        vis1 = Visitor(
            resident_id=created_residents[0].id,
            visitor_name="Sunil Sharma",
            phone="+91 98111 22233",
            relationship_to_resident="Father",
            id_proof_type="Aadhaar Card",
            id_proof_number="XXXX-XXXX-9021",
            purpose="Dropped off seasonal winter clothes and books",
            check_in_time=datetime.now(timezone.utc) - timedelta(hours=6),
            check_out_time=datetime.now(timezone.utc) - timedelta(hours=4),
            logged_by="Subedar Ramesh Singh"
        )
        db.add(vis1)

        print("Seeding Notices...")
        n1 = Notice(
            title="Hostel Night Gate Curfew Timings & Biometric Verification",
            content="All residents are reminded that the hostel main gates close strictly at 10:00 PM on weekdays and 10:30 PM on weekends. Late-entry outpass must be applied via the portal at least 4 hours in advance.",
            category="Discipline & Safety",
            target_audience="ALL",
            is_pinned=True,
            author_id=warden_user.id
        )
        n2 = Notice(
            title="Inter-Hostel Sports Tournament 2026 - Registration Open",
            content="Registrations are now open for Cricket, Badminton, Table Tennis, and Chess. Contact Block A/B/C Sports Representatives before Friday 5:00 PM.",
            category="Events",
            target_audience="ALL",
            is_pinned=False,
            author_id=warden_user.id
        )
        db.add_all([n1, n2])

        print("Seeding 7-Day Mess Menu...")
        mess_days = [
            ("Monday", "Poha / Idli Sambar, Boiled Eggs / Bananas, Tea / Coffee", "Paneer Butter Masala, Dal Tadka, Jeera Rice, Phulka, Curd, Salad", "Veg Sandwich / Samosa, Masala Chai", "Egg Curry / Malai Kofta, Mix Veg, Steamed Rice, Chapati, Gulab Jamun", "Special Kheer"),
            ("Tuesday", "Aloo Paratha with Curd & Pickle, Sprouted Moong, Milk / Tea", "Rajma Chawal, Aloo Gobhi, Plain Paratha, Boondi Raita, Green Salad", "Bhel Puri / Biscuit, Tea", "Kadai Paneer / Chicken Curry, Dal Makhani, Pulao, Roti, Ice Cream", "Mint Raita"),
            ("Wednesday", "Masala Dosa, Coconut & Tomato Chutney, Sambhar, Coffee", "Chole Bhature, Steamed Rice, Yellow Dal, Cucumber Salad", "Pani Puri / Veg Cutlet, Tea", "Bhindi Masala, Dal Fry, Jeera Rice, Tawa Roti, Fruit Custard", "Sweet Lassi"),
            ("Thursday", "Methi Thepla, Chana Masala, Curd, Milk / Tea", "Kadhi Pakora, Steamed Basmati Rice, Aloo Jeera, Chapati, Papad", "Pav Bhaji, Filter Coffee", "Shahi Paneer / Chicken Biryani, Raita, Onion Salad, Rasgulla", "Paneer Tikka"),
            ("Friday", "Upma with Coconut Chutney, Bread Omelette, Tea / Coffee", "Dal Makhani, Matar Mushroom, Vegetable Pulao, Garlic Naan", "Pasta / French Fries, Lemon Tea", "Veg Kofta, Moong Dal, Steamed Rice, Tandoori Roti, Gajar Halwa", "Ice Cream Sundae"),
            ("Saturday", "Puri Bhaji, Halwa, Boiled Chana, Masala Tea", "Dum Aloo, Dal Panchmel, Kashmiri Pulao, Chapati, Dahi Vada", "Aloo Tikki Chaat, Hot Coffee", "Palak Paneer / Mutton Rogan Josh, Dal Tadka, Steamed Rice, Paratha", "Moong Dal Halwa"),
            ("Sunday", "Special Chole Kulche, Sweet Lassi, Fresh Seasonal Fruits", "Hyderabadi Veg/Chicken Dum Biryani, Mirchi Ka Salan, Raita", "Cookies & Onion Pakora, Cutting Chai", "Mushroom Matar, Yellow Dal, Jeera Rice, Butter Roti, Rasmalai", "Special Feast")
        ]
        for day, bk, ln, sn, dn, sp in mess_days:
            menu = MessMenu(
                day_of_week=day,
                breakfast=bk,
                lunch=ln,
                snacks=sn,
                dinner=dn,
                special_item=sp
            )
            db.add(menu)

        db.commit()
        print("Database successfully seeded with realistic demonstration data!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
