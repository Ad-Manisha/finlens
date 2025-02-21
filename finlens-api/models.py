from sqlalchemy import Column, Integer, String, Date, TIMESTAMP
from database import Base
from sqlalchemy.orm import relationship

class User(Base):
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True) #Indexing - fast lookup and retreival
    name = Column(String(50), nullable=False) # NOT NULL Constraint
    email = Column(String(50), nullable=False, unique=True) # Unique Constraint
    password = Column(String(200), nullable=False)

    #Relationship with receipts
    user = relationship("Receipt", back_populates="user")

   
class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True) #Indexing - fast lookup and retreival
    subject = Column(String(255), nullable=False) # NOT NULL Constraint
    amount = Column(Float, nullable=False) # Unique Constraint
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    #Relationship with the User Model
    user = relationship("User", back_populates="receipts")
