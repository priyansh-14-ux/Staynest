from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.notice import Notice
from app.schemas.notice import NoticeCreate, NoticeOut

router = APIRouter(prefix="/notices", tags=["Notices & Bulletins"])

@router.get("", response_model=List[NoticeOut])
def get_notices(db: Session = Depends(get_db)):
    notices = db.query(Notice).order_by(Notice.is_pinned.desc(), Notice.created_at.desc()).all()
    results = []
    for n in notices:
        results.append(NoticeOut(
            id=n.id,
            title=n.title,
            content=n.content,
            category=n.category,
            target_audience=n.target_audience,
            is_pinned=n.is_pinned,
            author_id=n.author_id,
            author_name=n.author.full_name if n.author else "Hostel Office",
            created_at=n.created_at
        ))
    return results

@router.post("", response_model=NoticeOut, status_code=status.HTTP_201_CREATED)
def create_notice(
    data: NoticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    notice = Notice(
        **data.model_dump(),
        author_id=current_user.id
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return NoticeOut(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        category=notice.category,
        target_audience=notice.target_audience,
        is_pinned=notice.is_pinned,
        author_id=notice.author_id,
        author_name=current_user.full_name,
        created_at=notice.created_at
    )

@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.WARDEN]))
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(notice)
    db.commit()
    return None
