import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-that-is-extremely-long-and-secure-129381023')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///library.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-that-is-extremely-long-and-secure-92831023')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    
    # Business logic rules
    FINE_RATE_PER_DAY = 1000.0  # Fine in UGX per day
    MAX_RENEWALS = 2            # Maximum number of times a book can be renewed
    MAX_ACTIVE_BORROWS = 5      # Maximum books a user can borrow at once
    MAX_FINE_AMOUNT = 30000.0   # Cap fine at 30,000 UGX
    BLOCK_BORROW_THRESHOLD = 20000.0  # Block borrowing if unpaid fines exceed 20,000 UGX
