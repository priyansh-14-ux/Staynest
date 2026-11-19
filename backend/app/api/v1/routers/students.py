from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.resident import Resident, ResidentStatus
from app.schemas.resident import ResidentCreate, ResidentUpdate, ResidentOut, ResidentDetailOut
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students & Residents"])

@router.get("", response_model=dict)
def get_students(
    search: Optional[str] = None,
    status_filter: Optional[ResidentStatus] = None,
    course_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    items, total = StudentService.get_students(
        db, search=search, status_filter=status_filter, course_filter=course_filter,
        skip=skip, limit=limit
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.post("", response_model=ResidentOut, status_code=status.HTTP_201_CREATED)
def admit_student(
    data: ResidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    resident = StudentService.create_student(db, data)
    return StudentService.get_student_by_id(db, resident.id)

@router.get("/{student_id}", response_model=ResidentDetailOut)
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    return StudentService.get_student_by_id(db, student_id)
