import pytest
from datetime import date
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.resident import Resident, ResidentStatus
from app.models.fee import FeeInvoice, Payment, InvoiceStatus, PaymentMethod

@pytest.fixture
def setup_fee_env(db_session, client):
    accountant = User(
        email="acc_test@hostel.edu",
        username="acc_test",
        hashed_password=hash_password("accpass"),
        full_name="Accountant Test",
        role=UserRole.ACCOUNTANT,
        is_active=True
    )
    s_user = User(
        email="student_fee@hostel.edu",
        username="student_fee",
        hashed_password=hash_password("pass123"),
        full_name="Student Fee Test",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add_all([accountant, s_user])
    db_session.flush()

    resident = Resident(
        user_id=s_user.id,
        registration_number="REG-FEE-01",
        course="B.Tech IT",
        guardian_name="Guardian Fee",
        guardian_phone="9876500001",
        gender="Male",
        status=ResidentStatus.ACTIVE
    )
    db_session.add(resident)
    db_session.commit()

    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "acc_test",
        "password": "accpass"
    })
    token = login_res.json()["access_token"]

    return {
        "token": token,
        "resident": resident
    }

def test_generate_invoice_and_partial_payment(client, setup_fee_env):
    env = setup_fee_env
    # 1. Create individual invoice of ₹50,000
    inv_res = client.post(
        "/api/v1/fees/invoices/individual",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["resident"].id,
            "title": "Semester 1 Fee",
            "billing_period": "July - Dec 2026",
            "total_amount": 50000.0,
            "due_date": "2026-12-31"
        }
    )
    assert inv_res.status_code == 201
    invoice = inv_res.json()
    inv_id = invoice["id"]
    assert invoice["total_amount"] == 50000.0
    assert invoice["paid_amount"] == 0.0
    assert invoice["remaining_due"] == 50000.0
    assert invoice["status"] == "UNPAID"

    # 2. Record partial payment of ₹20,000
    pay_res = client.post(
        "/api/v1/fees/payments",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "invoice_id": inv_id,
            "amount": 20000.0,
            "payment_method": "UPI",
            "transaction_ref": "UPI_REF_12345",
            "remarks": "First installment"
        }
    )
    assert pay_res.status_code == 201
    receipt_no = pay_res.json()["receipt_number"]

    # 3. Check updated invoice
    invoices = client.get(
        f"/api/v1/fees/invoices?resident_id={env['resident'].id}",
        headers={"Authorization": f"Bearer {env['token']}"}
    ).json()
    updated_inv = [i for i in invoices if i["id"] == inv_id][0]
    assert updated_inv["paid_amount"] == 20000.0
    assert updated_inv["remaining_due"] == 30000.0
    assert updated_inv["status"] == "PARTIALLY_PAID"

    # 4. Check receipt endpoint
    rec_res = client.get(f"/api/v1/fees/receipts/{receipt_no}")
    assert rec_res.status_code == 200
    assert rec_res.json()["amount_paid"] == 20000.0
    assert rec_res.json()["remaining_invoice_due"] == 30000.0

def test_prevent_payment_overpay(client, setup_fee_env):
    env = setup_fee_env
    # Create invoice for ₹10,000
    inv_res = client.post(
        "/api/v1/fees/invoices/individual",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "resident_id": env["resident"].id,
            "title": "Exam & Library Fee",
            "billing_period": "Odd Sem 2026",
            "total_amount": 10000.0,
            "due_date": "2026-12-31"
        }
    )
    inv_id = inv_res.json()["id"]

    # Attempt to pay ₹12,000 (exceeding balance)
    pay_res = client.post(
        "/api/v1/fees/payments",
        headers={"Authorization": f"Bearer {env['token']}"},
        json={
            "invoice_id": inv_id,
            "amount": 12000.0,
            "payment_method": "CASH"
        }
    )
    assert pay_res.status_code == 400
    assert "exceeds remaining invoice balance" in pay_res.json()["detail"]
