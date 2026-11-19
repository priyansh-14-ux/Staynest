import pytest
from app.core.security import hash_password
from app.models.user import User, UserRole

def test_login_success(client, db_session):
    # Create test user
    user = User(
        email="testwarden@hostel.edu",
        username="warden1",
        hashed_password=hash_password("securepassword"),
        full_name="Prof. Test Warden",
        role=UserRole.WARDEN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "warden1",
        "password": "securepassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["username"] == "warden1"
    assert data["user"]["role"] == "WARDEN"

def test_login_invalid_password(client, db_session):
    user = User(
        email="testuser@hostel.edu",
        username="testuser",
        hashed_password=hash_password("correctpass"),
        full_name="Test User",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "testuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]

def test_rbac_student_forbidden_from_admin_endpoint(client, db_session):
    # Create student
    student_user = User(
        email="student@hostel.edu",
        username="student1",
        hashed_password=hash_password("pass123"),
        full_name="Student One",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add(student_user)
    db_session.commit()

    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "student1",
        "password": "pass123"
    })
    token = login_res.json()["access_token"]

    # Student attempts to create a hostel (Warden/Admin only)
    res = client.post(
        "/api/v1/hostels",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Unauthorized Hostel",
            "code": "UNAUTH",
            "address": "Campus"
        }
    )
    assert res.status_code == 403
    assert "Operation not permitted" in res.json()["detail"]
