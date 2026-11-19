import urllib.request
import json

def verify_all():
    print("========================================")
    print("HOSTEL MANAGEMENT SYSTEM - E2E TEST")
    print("========================================")

    # 1. Health check
    res = urllib.request.urlopen('http://127.0.0.1:8000/health')
    health = json.loads(res.read().decode())
    print(f"1. Health Check: {health['status']} ({health['service']} v{health['version']})")

    # 2. Login with super_admin
    login_data = json.dumps({'username_or_email': 'admin', 'password': 'admin123'}).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    token_resp = json.loads(res.read().decode())
    token = token_resp['access_token']
    role = token_resp['user']['role']
    print(f"2. Auth: Super Admin logged in successfully (Role: {role})")

    # 3. Dashboard stats
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/analytics/dashboard-stats', headers={'Authorization': f'Bearer {token}'})
    res = urllib.request.urlopen(req)
    stats = json.loads(res.read().decode())
    print(f"3. Dashboard KPIs: Total Beds={stats['total_beds']}, Occupied={stats['occupied_beds']}, Available={stats['available_beds']}, Occupancy={stats['occupancy_rate']}%")

    # 4. Rooms visual grid matrix
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/rooms/grid', headers={'Authorization': f'Bearer {token}'})
    res = urllib.request.urlopen(req)
    grid = json.loads(res.read().decode())
    print(f"4. Visual Grid: {len(grid)} Blocks loaded with hierarchical room/bed states")

    # 5. Defaulters List
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/fees/defaulters', headers={'Authorization': f'Bearer {token}'})
    res = urllib.request.urlopen(req)
    defaulters = json.loads(res.read().decode())
    print(f"5. Fee Invoicing: {len(defaulters)} Defaulters detected with dues")

    # 6. Leaves and Gate Passes
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/leaves/', headers={'Authorization': f'Bearer {token}'})
    res = urllib.request.urlopen(req)
    leaves = json.loads(res.read().decode())
    print(f"6. Leaves/Outpasses: {len(leaves)} Applications on file")

    # 7. Frontend HTTP check
    res = urllib.request.urlopen('http://127.0.0.1:5173/')
    html = res.read().decode()
    has_root = 'id="root"' in html
    print(f"7. Frontend UI: Served with HTTP {res.status} (React root element present: {has_root})")

    print("========================================")
    print("ALL ENDPOINTS & CLIENT RESPONDING 100% OK")
    print("========================================")

if __name__ == '__main__':
    verify_all()
