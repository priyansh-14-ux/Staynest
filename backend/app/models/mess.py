from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base

class MessMenu(Base):
    __tablename__ = "mess_menus"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), unique=True, nullable=False)  # Monday, Tuesday, ...
    breakfast = Column(Text, nullable=False)
    lunch = Column(Text, nullable=False)
    snacks = Column(Text, nullable=False)
    dinner = Column(Text, nullable=False)
    special_item = Column(String(150), nullable=True)
