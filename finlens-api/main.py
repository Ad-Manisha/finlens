import bcrypt
from fastapi import FastAPI, Depends, status, HTTPException
from schemas import RegisterUserRequest, RegisterUserResponse, LoginUserRequest
from database import Base, engine, SessionLocal
from models import User
from sqlalchemy.orm import Session
from utils import verify_password


# create the table in the db if not created already
Base.metadata.create_all(bind=engine)

app = FastAPI()


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