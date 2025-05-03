from pydantic import BaseModel, validator, EmailStr

class RegisterUserRequest(BaseModel):
    name : str
    email: str
    password: str


    # Add a validator for the password field
    @validator("password")
    def password_length(cls, value):
        if len(value) <= 6:
            raise ValueError("Password must be longer than 6 characters")
        return value

class RegisterUserResponse(BaseModel):
    id: int
    name : EmailStr
    email: str

    class Config:
        from_attributes = True
        
class LoginUserRequest(BaseModel):
    email: str
    password: str



    class Config:
        from_attributes = True

class BudgetRequest(BaseModel):
    user_id: int
    category: str
    amount: float
    month: str

class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    month: str

    class Config:
        from_attributes = True

class TextRequest(BaseModel):
    text: str

class ReceiptText(BaseModel):
    user_id: int
    text: str
