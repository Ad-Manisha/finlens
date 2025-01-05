from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Create a db engine to connect to MySQL
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost:3306/finlens"

# Create the engine 
engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)

# Create a session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define base class for all the models 
Base = declarative_base()





