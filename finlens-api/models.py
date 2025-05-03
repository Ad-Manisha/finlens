from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from database import Base
from sqlalchemy.orm import relationship
import datetime

class User(Base):
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True) #Indexing - fast lookup and retreival
    name = Column(String(50), nullable=False) # NOT NULL Constraint
    email = Column(String(50), nullable=False, unique=True) # Unique Constraint
    password = Column(String(200), nullable=False)

    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")

    
class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="expenses")
 
class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    month = Column(String(7), nullable=False)

    user = relationship("User", backref="budgets")