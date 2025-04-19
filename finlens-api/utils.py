import bcrypt
from dotenv import load_dotenv
import os
import openai

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify if the provided plain password matches the hashed password.
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")