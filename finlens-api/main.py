import io 
import json
import pytesseract
import os
import re 
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\manis\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
import bcrypt
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, status, HTTPException, File, UploadFile, Request, Query
from fastapi.responses import JSONResponse
from schemas import RegisterUserRequest, RegisterUserResponse, LoginUserRequest, BudgetRequest,TextRequest, ReceiptText
from database import Base, engine, SessionLocal
from pydantic import BaseModel
from models import User, Expense, Budget
from sqlalchemy import func
from sqlalchemy.orm import Session
from utils import  trained_model as model, verify_password, preprocess_line, categorize_text_local, call_ollama_model, strip_price, clean_line_start
from PIL import Image
from dotenv import load_dotenv
import shutil
from collections import defaultdict
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import List
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import make_pipeline
from sklearn.naive_bayes import MultinomialNB
import logging




load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# create the table in the db if not created already
Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

class TextData(BaseModel):
    text: str


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
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Ensure the file is a valid image
        if file.content_type not in ["image/jpeg", "image/png", "image/tiff", "image/bmp"]:
            raise HTTPException(status_code=400, detail="Unsupported file type")


        text = str(pytesseract.image_to_string(image))
        return {"text": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing the receipt: {str(e)}")


@app.post("/categorize")
def categorize_text(req: TextRequest):
    try:
        category = categorize_text_local(req.text)
        return {"category": category}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


IGNORED_TERMS = {
    "subtotal", "total", "tax", "thank you", "tel", "citystore", "cityville",
    "invoice", "order no", "receipt", "date", "cashier", "payment", "balance",
    "change", "amount due", "vat", "store", "example st"
}

@app.post("/categorize-receipt")
async def categorize_receipt(
    receipt: ReceiptText,
    db: Session = Depends(get_db)
):
    user_id = receipt.user_id
    text = receipt.text

    categorized_totals = defaultdict(float)
    all_categories = set()
    line_items = []
    uncategorized_lines = []
    ignored_count = 0
    alerts = []

    raw_lines = text.split('\n')
    lines = []
    i = 0
    while i < len(raw_lines):
        current_line = raw_lines[i].strip()
        if i + 1 < len(raw_lines):
            next_line = raw_lines[i + 1].strip()
            if (
                not re.search(r'\d+', current_line) and
                re.match(r'^\$?\d+(\.\d{1,2})?$', next_line)
            ):
                lines.append(f"{current_line} {next_line}")
                i += 2
                continue
        lines.append(current_line)
        i += 1

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Ignore address, date, and time lines
        if re.search(r'\d{1,3}\s+\w+\s+(st|road|rd|ave|avenue|blvd|street|city|village|town)', line, re.IGNORECASE):
            ignored_count += 1
            continue
        if re.search(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', line) or re.search(r'\b\d{1,2}:\d{2}\b', line):
            ignored_count += 1
            continue

        # Extract amount
        match = re.search(r'(\$?\d+(?:[.,]\d{1,2})?)\s*$', line)
        amount = 0.0
        if match:
            try:
                amount = float(match.group(1).replace(',', '').replace('₹', '').replace('$', '').replace('€', ''))
            except ValueError:
                continue
        if amount == 0.0:
            continue

        clean_line = preprocess_line(line)
        normalized_line = clean_line.lower()

        if any(term in normalized_line for term in IGNORED_TERMS):
            ignored_count += 1
            continue

        stripped_line = strip_price(clean_line).strip()
        if not stripped_line:
            continue

        # Predict category
        try:
            probas = model.predict_proba([stripped_line])[0]
            category = model.classes_[probas.argmax()]
            confidence = probas.max()
        except Exception:
            category = "uncategorized"
            confidence = 0.0

        used_fallback = False
        if confidence < 0.5 or category.lower() in ["unknown", "uncategorized"]:
            try:
                fallback_category = call_ollama_model(clean_line)
                if fallback_category and fallback_category.lower() not in ["unknown", "item", "product"]:
                    category = fallback_category
                    used_fallback = True
                else:
                    category = "uncategorized"
                    uncategorized_lines.append(line)
            except Exception:
                category = "uncategorized"
                uncategorized_lines.append(line)

        category = category.lower()
        all_categories.add(category)

        line_items.append({
            "description": line,
            "category": category,
            "amount": amount
        })

        try:
            new_expense = Expense(
                user_id=user_id,
                category=category,
                amount=amount,
                description=line
            )
            db.add(new_expense)
            db.commit()
            db.refresh(new_expense)
            categorized_totals[category] += amount
        except Exception:
            db.rollback()

    for category in all_categories:
        categorized_totals.setdefault(category, 0.0)

    return {
        "categorized": {k: round(v, 2) for k, v in categorized_totals.items()},
        "uncategorized_lines": uncategorized_lines,
        "line_items": line_items,
        "alerts": alerts
    }


@app.post("/expenses/add")
def add_expense(
    user_id: int,
    category: str,
    amount: float,
    description: str = None,
    db: Session = Depends(get_db)
):
    try:
        current_month = datetime.utcnow().strftime("%Y-%m")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        budget = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month == current_month
        ).first()

        total_spent = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.category == category,
            func.date_format(Expense.created_at, '%Y-%m') == current_month
        ).scalar() or 0.0

        will_exceed = False
        budget_alert = None
        limit_percentage = 0.90

        if budget:
            if total_spent + amount > budget.amount:
                will_exceed = True
                budget_alert = "LIMIT EXCEEDED"
            elif total_spent + amount >= budget.amount * limit_percentage:
                budget_alert = "Near Limit"

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
            "budget_alert": budget_alert,
            "expense": {
                "id": db_expense.id,
                "user_id": db_expense.user_id,
                "category": db_expense.category,
                "amount": db_expense.amount,
                "description": db_expense.description,
                "created_at": db_expense.created_at
            }
        }

    except Exception as e:
        logger.exception("Error adding expense")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error adding expense")


    

@app.post("/budget/set", status_code=201)
def set_budget(budget: BudgetRequest, db: Session = Depends(get_db)):
    if budget.amount <= 0:
        raise HTTPException(status_code=400, detail="Budget amount must be positive")

    existing = db.query(Budget).filter(
        Budget.user_id == budget.user_id,
        Budget.category == budget.category,
        Budget.month == budget.month
    ).first()

    if existing:
        existing.amount = budget.amount
        action = "updated"
    else:
        new_budget = Budget(
            user_id=budget.user_id,
            category=budget.category,
            amount=budget.amount,
            month=budget.month
        )
        db.add(new_budget)
        action = "created"

    db.commit()
    return {"msg": f"Budget {action} successfully"}


@app.get("/budget/alerts/{user_id}")
def get_budget_alerts(user_id: int, db: Session = Depends(get_db)):
    try:
        current_month = datetime.utcnow().strftime("%Y-%m")
        limit_percentage = 0.8  # Example: 80% threshold
  
        # Get all budgets for the user for the current month
        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == current_month
        ).all()

        alerts = []

        for budget in budgets:
            # Total spent in the budget category
            total_spent = db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.category == budget.category,
                func.date_format(Expense.created_at, '%Y-%m') == current_month
            ).scalar() or 0.0

            if total_spent > budget.amount:
                status = "EXCEEDED"
            elif total_spent >= budget.amount * limit_percentage:
                status = "NEAR_LIMIT"
            else:
                continue  

            alerts.append({
                "category": budget.category,
                "budget": round(budget.amount, 2),
                "spent": round(total_spent, 2),
                "status": status
            })
            logger.info(f"[ALERT] {budget.category}: Spent {total_spent} of {budget.amount} → Status: {status}")

        return {"alerts": alerts}

    except Exception as e:
        logger.error(f"Failed to fetch budget alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch budget alerts")
