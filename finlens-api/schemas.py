from pydantic import BaseModel, validator

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

class RegisterUserResponse():
    id: int
    name : str
    email: str

    class config:
        orm_mode = True

class LoginUserRequest(BaseModel):
    email: str
    password: str



    class Config:
        orm_mode = True

