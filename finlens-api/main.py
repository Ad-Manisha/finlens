import io 
import json
import openai
from openai import OpenAI
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\manis\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
import bcrypt
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, status, HTTPException, File, UploadFile, Request, APIRouter
from fastapi.responses import JSONResponse
from schemas import RegisterUserRequest, RegisterUserResponse, LoginUserRequest
from database import Base, engine, SessionLocal
from pydantic import BaseModel
from models import User, Expense
from sqlalchemy.orm import Session
from utils import verify_password
from PIL import Image
from dotenv import load_dotenv
import os
import shutil
from collections import defaultdict
import re 
from datetime import datetime

load_dotenv()

client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

class TextData(BaseModel):
    text: str


# create the table in the db if not created already
Base.metadata.create_all(bind=engine)

app = FastAPI()

""" origins = [
    
    "http://localhost:5173",  # For React apps running on port 3000, for example
] """

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify allowed origins
    # allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

#Db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@app.get("/test")
def getMessage():
    return "Hi! welcome"

    # CREATE User       
@app.post("/users/signup", status_code=status.HTTP_201_CREATED)
def create_user(user: RegisterUserRequest, db: Session = Depends(get_db)):
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )


    # Hash the password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())


    db_user = User(
        name= user.name,
        email= user.email,
        password= hashed_password.decode('utf-8'),
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    
    return {
        'msg': 'User Created Succesfully',
        'status': 'SUCCESS',
        "user": {
                "id": db_user.id,
                "name": db_user.name,
                "email": db_user.email
            }
    }

    #Login User

@app.post("/users/login", status_code=status.HTTP_200_OK)
def login_user(user: LoginUserRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not  db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return {
        "msg": "Login successful",
        "status": "SUCCESS",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email
        }
    }


   # Upload Receipt

@app.post("/upload-receipt")
async def upload_receipt(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    text = str(pytesseract.image_to_string(image))
    return {"text": text}


@app.post("/categorize-text")
async def categorize_text(data: TextData, user_id: int, db: Session = Depends(get_db)):
    try:
        print(f"Received text:\n{data.text}")
        print(f"User ID: {user_id}")
        
        category_keywords = {
            "Groceries": ["rice", "cooking oil", "flour", "sugar", "salt", "apples", "tomato", "beef", "onion","cheese"],
            "Food": ["soft drink", "pizza", "frozen pizza", "snack", "chocolate", "drink", "orange juice","fish"],
            "Personal Care": ["face wash", "lip balm", "shampoo", "soap", "toothpaste", "chapstick"],
            "Electronics": ["usb cable", "power bank", "charger", "earphones", "headphones"],
            "Health": ["multivitamins", "vitamins", "bandages", "medicine", "first aid", "plaster"],
            "Entertainment": ["movie", "dvd", "puzzle", "game", "board game", "blu-ray"],
        }

        categorized = defaultdict(float)
        waiting_items = []
        found_amounts = []
        uncategorized_lines = []

        lines = data.text.split("\n")
        for line in lines:
            original_line = line.strip()
            line_clean = original_line.strip("=~-• ").lower()
            if not line_clean:
                continue

            # Extract amount using broader regex (supports Rs/$/€ and commas)
            amount_match = re.search(r"(?:[\$₹€Rs\.]?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+)", line_clean)
            amount = 0.0
            if amount_match:
                try:
                    amount_str = amount_match.group(1).replace(",", "")
                    amount = float(amount_str)
                except ValueError:
                    print(f"Could not convert amount: {amount_match.group(1)}")

            # Find category
            matched_category = None
            for category, keywords in category_keywords.items():
                for keyword in keywords:
                    if re.search(rf"\b{re.escape(keyword)}\b", line_clean):
                        matched_category = category
                        break
                if matched_category:
                    break

            # Case 1: Category and amount on the same line
            if matched_category and amount > 0:
                categorized[matched_category] += amount
                db.add(Expense(
                    user_id=user_id,
                    category=matched_category,
                    amount=amount,
                    description=original_line,
                    created_at=datetime.now()
                ))
                print(f"Saved: {matched_category} - {amount} from '{original_line}'")
            # Case 2: Category found, no amount
            elif matched_category and amount == 0:
                waiting_items.append((matched_category, original_line))
                print(f"Matched item '{original_line}' but waiting for price...")
            # Case 3: Amount found, no category
            elif not matched_category and amount > 0:
                found_amounts.append(amount)
                print(f"Found amount {amount} without category from '{original_line}'")
            # Case 4: Neither found
            else:
                uncategorized_lines.append(original_line)
                print(f"No match for line: '{original_line}'")

        # Match waiting items with leftover amounts
        for i, (category, description) in enumerate(waiting_items):
            if i < len(found_amounts):
                amount = found_amounts[i]
                categorized[category] += amount
                db.add(Expense(
                    user_id=user_id,
                    category=category,
                    amount=amount,
                    description=f"{description} (${amount})",
                    created_at=datetime.now()
                ))
                print(f"Backfilled: {category} - {amount} for '{description}'")
            else:
                uncategorized_lines.append(description)
                print(f"No amount found for waiting item: '{description}'")

        db.commit()

        if not categorized:
            categorized["Uncategorized"] = 0.0

        return {
            "raw_text": data.text,
            "categorized": dict(sorted(categorized.items())),
            "uncategorized_lines": uncategorized_lines
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/expenses/add")
def add_expense(
    user_id: int,
    category: str,
    amount: float,
    description: str = None,
    db: Session = Depends(get_db)
):
    db_expense = Expense(
        user_id=user_id,
        category=category,
        amount=amount,
        description=description,
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    return {
        "msg": "Expense Added Successfully",
        "status": "SUCCESS",
        "expense": {
            "id": db_expense.id,
            "user_id": db_expense.user_id,
            "category": db_expense.category,
            "amount": db_expense.amount,
            "description": db_expense.description,
            "created_at": db_expense.created_at
        }
    }
