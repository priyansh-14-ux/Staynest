from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.mess import MessMenu
from app.schemas.mess import MessMenuCreate, MessMenuOut

router = APIRouter(prefix="/mess", tags=["Mess & Dining"])

@router.get("/menu", response_model=List[MessMenuOut])
def get_mess_menu(db: Session = Depends(get_db)):
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    menus = db.query(MessMenu).all()
    # Sort according to standard week days
    menus_sorted = sorted(menus, key=lambda m: days_order.index(m.day_of_week) if m.day_of_week in days_order else 99)
    return menus_sorted

@router.put("/menu/{day}", response_model=MessMenuOut)
def update_mess_day(
    day: str,
    data: MessMenuCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    menu = db.query(MessMenu).filter(MessMenu.day_of_week.ilike(day)).first()
    if not menu:
        menu = MessMenu(day_of_week=day, **data.model_dump(exclude={"day_of_week"}))
        db.add(menu)
    else:
        menu.breakfast = data.breakfast
        menu.lunch = data.lunch
        menu.snacks = data.snacks
        menu.dinner = data.dinner
        menu.special_item = data.special_item

    db.commit()
    db.refresh(menu)
    return menu
