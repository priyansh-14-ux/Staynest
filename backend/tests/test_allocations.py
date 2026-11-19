import pytest
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.hostel import Hostel, Block, Floor, Room, Bed, BedStatus, RoomType, GenderType
from app.models.resident import Resident, ResidentStatus
from app.models.allocation import Allocation, AllocationStatus

@pytest.fixture
def setup_allocation_env(db_session, client):
    # Admin user
    admin = User(
        email="admin_alloc@hostel.edu",
        username="admin_alloc",
        hashed_password=hash_password("adminpass"),
        full_name="Admin Allocator",
        role=UserRole.SUPER_ADMIN,
        is_active=True
    )
    # Student 1
    s1_user = User(
        email="student1_alloc@hostel.edu",
        username="s1_alloc",
        hashed_password=hash_password("pass123"),
        full_name="Rohan Sharma",
        role=UserRole.STUDENT,
        is_active=True
    )
    # Student 2
    s2_user = User(
        email="student2_alloc@hostel.edu",
        username="s2_alloc",
        hashed_password=hash_password("pass123"),
        full_name="Aditya Verma",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add_all([admin, s1_user, s2_user])
    db_session.flush()

    res1 = Resident(
        user_id=s1_user.id,
        registration_number="REG-TEST-001",
        course="B.Tech CSE",
        guardian_name="G. Sharma",
        guardian_phone="9999999991",
        gender="Male",
        status=ResidentStatus.ACTIVE
    )
    res2 = Resident(
        user_id=s2_user.id,
        registration_number="REG-TEST-002",
        course="B.Tech ECE",
        guardian_name="G. Verma",
        guardian_phone="9999999992",
        gender="Male",
        status=ResidentStatus.ACTIVE
    )
    db_session.add_all([res1, res2])
    db_session.flush()

    # Hostel, Block, Floor, Room with 2 beds
    hostel = Hostel(name="Test Hostel", code="TH1")
    db_session.add(hostel)
    db_session.flush()

    block = Block(hostel_id=hostel.id, name="Block A", gender=GenderType.MALE)
    db_session.add(block)
    db_session.flush()

    floor = Floor(block_id=block.id, floor_number=1, floor_name="1st Floor")
    db_session.add(floor)
    db_session.flush()

    room = Room(floor_id=floor.id, room_number="101", room_type=RoomType.DOUBLE_NON_AC, capacity=2)
    db_session.add(room)
    db_session.flush()

    bed1 = Bed(room_id=room.id, bed_number="Bed-1", status=BedStatus.AVAILABLE)
    bed2 = Bed(room_id=room.id, bed_number="Bed-2", status=BedStatus.AVAILABLE)
    db_session.add_all([bed1, bed2])
    db_session.commit()

    # Auth token for admin
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin_alloc",
        "password": "adminpass"
    })
    token = login_res.json()["access_token"]

    return {
        "token": token,
        "res1": res1,
        "res2": res2,
        "bed1": bed1,
        "bed2": bed2
    }

def test_allocate_bed_success(client, setup_allocation_env, db_session):
    env = setup_allocation_env
    res = client.post(
        "/api/v1/allocations",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["res1"].id,
            "bed_id": env["bed1"].id,
            "academic_year": "2026-2027"
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "ACTIVE"
    assert data["bed_number"] == "Bed-1"

    # Verify bed status in DB
    bed = db_session.query(Bed).filter(Bed.id == env["bed1"].id).first()
    assert bed.status == BedStatus.OCCUPIED

def test_prevent_double_booking_bed(client, setup_allocation_env):
    env = setup_allocation_env
    # 1. Allocate bed1 to student 1
    res1 = client.post(
        "/api/v1/allocations",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["res1"].id,
            "bed_id": env["bed1"].id,
            "academic_year": "2026-2027"
        }
    )
    assert res1.status_code == 201

    # 2. Attempt to allocate the same bed1 to student 2
    res2 = client.post(
        "/api/v1/allocations",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["res2"].id,
            "bed_id": env["bed1"].id,
            "academic_year": "2026-2027"
        }
    )
    assert res2.status_code == 400
    assert "not available" in res2.json()["detail"]

def test_prevent_duplicate_active_allocation_for_student(client, setup_allocation_env):
    env = setup_allocation_env
    # Allocate student 1 to bed 1
    res1 = client.post(
        "/api/v1/allocations",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["res1"].id,
            "bed_id": env["bed1"].id,
            "academic_year": "2026-2027"
        }
    )
    assert res1.status_code == 201

    # Attempt to allocate student 1 to bed 2 as well
    res2 = client.post(
        "/api/v1/allocations",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["res1"].id,
            "bed_id": env["bed2"].id,
            "academic_year": "2026-2027"
        }
    )
    assert res2.status_code == 400
    assert "already has an active bed allocation" in res2.json()["detail"]

def test_bed_transfer(client, setup_allocation_env, db_session):
    env = setup_allocation_env
    # Allocate to bed 1
    alloc_res = client.post(
        "/api/v1/allocations",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["res1"].id,
            "bed_id": env["bed1"].id,
            "academic_year": "2026-2027"
        }
    )
    alloc_id = alloc_res.json()["id"]

    # Transfer to bed 2
    transfer_res = client.post(
        "/api/v1/allocations/transfer",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "allocation_id": alloc_id,
            "new_bed_id": env["bed2"].id,
            "remarks": "Preferred window side bed"
        }
    )
    assert transfer_res.status_code == 200
    assert transfer_res.json()["bed_number"] == "Bed-2"

    # Verify bed statuses
    bed1 = db_session.query(Bed).filter(Bed.id == env["bed1"].id).first()
    bed2 = db_session.query(Bed).filter(Bed.id == env["bed2"].id).first()
    assert bed1.status == BedStatus.AVAILABLE
    assert bed2.status == BedStatus.OCCUPIED
