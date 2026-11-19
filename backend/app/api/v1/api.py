from fastapi import APIRouter
from app.api.v1.routers import (
    auth, hostels, rooms, allocations, students,
    fees, leaves, attendance, complaints, visitors,
    notices, mess, analytics, reports
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(hostels.router)
api_router.include_router(rooms.router)
api_router.include_router(allocations.router)
api_router.include_router(students.router)
api_router.include_router(fees.router)
api_router.include_router(leaves.router)
api_router.include_router(attendance.router)
api_router.include_router(complaints.router)
api_router.include_router(visitors.router)
api_router.include_router(notices.router)
api_router.include_router(mess.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
