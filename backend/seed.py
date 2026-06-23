from datetime import datetime, date, timedelta
from backend.app import app
from backend.models import db, User, Book, BorrowRecord, Fine

def seed_database():
    print("Initializing seed process...")
    
    # 1. Clear database
    db.drop_all()
    db.create_all()
    print("Database tables cleared and re-created.")
    
    # 2. Seed Users
    print("Seeding users...")
    
    # Librarians
    lib1 = User(username="librarian1", email="admin1@library.org", role="librarian")
    lib1.set_password("password")
    
    lib2 = User(username="librarian2", email="admin2@library.org", role="librarian")
    lib2.set_password("password")
    
    # Members
    m1 = User(username="sarah_jones", email="sarah@gmail.com", role="member")
    m1.set_password("password")
    
    m2 = User(username="john_doe", email="john@gmail.com", role="member")
    m2.set_password("password")
    
    m3 = User(username="emma_watson", email="emma@outlook.com", role="member")
    m3.set_password("password")
    
    m4 = User(username="david_k", email="david@yahoo.com", role="member")
    m4.set_password("password")
    
    m5 = User(username="lucas_m", email="lucas@gmail.com", role="member")
    m5.set_password("password")
    
    db.session.add_all([lib1, lib2, m1, m2, m3, m4, m5])
    db.session.commit()
    print("Users seeded successfully.")

    # 3. Seed Books
    print("Seeding books...")
    
    books_data = [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "9780743273565",
            "genre": "Fiction",
            "published_year": 1925,
            "copies_total": 4,
            "copies_available": 2,
            "cover_image_url": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "isbn": "9780446310789",
            "genre": "Classic",
            "published_year": 1960,
            "copies_total": 3,
            "copies_available": 2,
            "cover_image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "9780451524935",
            "genre": "Sci-Fi / Dystopian",
            "published_year": 1949,
            "copies_total": 5,
            "copies_available": 3,
            "cover_image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "Educated",
            "author": "Tara Westover",
            "isbn": "9780399590504",
            "genre": "Biography / Memoir",
            "published_year": 2018,
            "copies_total": 2,
            "copies_available": 1,
            "cover_image_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "Sapiens: A Brief History of Humankind",
            "author": "Yuval Noah Harari",
            "isbn": "9780062316097",
            "genre": "History",
            "published_year": 2011,
            "copies_total": 3,
            "copies_available": 1,
            "cover_image_url": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "The Silent Patient",
            "author": "Alex Michaelides",
            "isbn": "9781250301697",
            "genre": "Thriller",
            "published_year": 2019,
            "copies_total": 3,
            "copies_available": 3,
            "cover_image_url": "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "Atomic Habits",
            "author": "James Clear",
            "isbn": "9780735211292",
            "genre": "Self-Help",
            "published_year": 2018,
            "copies_total": 6,
            "copies_available": 4,
            "cover_image_url": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien",
            "isbn": "9780547928227",
            "genre": "Fantasy",
            "published_year": 1937,
            "copies_total": 4,
            "copies_available": 3,
            "cover_image_url": "https://images.unsplash.com/photo-1629981879719-1776b7e474eb?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "Dune",
            "author": "Frank Herbert",
            "isbn": "9780441172719",
            "genre": "Sci-Fi / Dystopian",
            "published_year": 1965,
            "copies_total": 3,
            "copies_available": 2,
            "cover_image_url": "https://images.unsplash.com/photo-1531988042231-d39a9cc12a9a?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "Becoming",
            "author": "Michelle Obama",
            "isbn": "9781524763138",
            "genre": "Biography / Memoir",
            "published_year": 2018,
            "copies_total": 2,
            "copies_available": 2,
            "cover_image_url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "Brave New World",
            "author": "Aldous Huxley",
            "isbn": "9780060850524",
            "genre": "Sci-Fi / Dystopian",
            "published_year": 1932,
            "copies_total": 2,
            "copies_available": 1,
            "cover_image_url": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=400"
        },
        {
            "title": "Thinking, Fast and Slow",
            "author": "Daniel Kahneman",
            "isbn": "9780374275631",
            "genre": "Psychology",
            "published_year": 2011,
            "copies_total": 3,
            "copies_available": 3,
            "cover_image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400"
        }
    ]
    
    books = []
    for bd in books_data:
        b = Book(**bd)
        books.append(b)
        db.session.add(b)
        
    db.session.commit()
    print("Books seeded successfully.")

    # 4. Seed Borrow History (Historical trends + circulation loops)
    print("Seeding borrow records and fines...")
    
    today = datetime.utcnow().date()
    
    # Let's map users and books for seeding:
    # m1: Sarah, m2: John, m3: Emma, m4: David, m5: Lucas
    # Books list:
    # 0: Gatsby, 1: Mockingbird, 2: 1984, 3: Educated, 4: Sapiens, 5: Silent Patient, 6: Habits, 7: Hobbit, 8: Dune, 9: Becoming, 10: Brave New World, 11: Thinking
    
    # Case A: On-Time Return in the past (Sarah borrowed Gatsby 120 days ago, due in 14 days, returned 110 days ago)
    record1 = BorrowRecord(
        user_id=m1.id,
        book_id=books[0].id,
        borrow_date=today - timedelta(days=120),
        due_date=today - timedelta(days=106),
        return_date=today - timedelta(days=110),
        status='returned',
        renew_count=0
    )
    
    # Case B: Late Return in the past with PAID fine (John borrowed Sapiens 90 days ago, due in 14 days, returned 60 days ago. Late by 16 days. Paid fine of 16,000 UGX)
    record2 = BorrowRecord(
        user_id=m2.id,
        book_id=books[4].id,
        borrow_date=today - timedelta(days=90),
        due_date=today - timedelta(days=76),
        return_date=today - timedelta(days=60),
        status='returned',
        renew_count=0
    )
    db.session.add_all([record1, record2])
    db.session.flush() # Flush to get record IDs
    
    fine_paid = Fine(
        borrow_record_id=record2.id,
        amount=16000.00,
        status='paid',
        created_at=datetime.utcnow() - timedelta(days=60),
        paid_at=datetime.utcnow() - timedelta(days=59)
    )
    db.session.add(fine_paid)
    
    # Case C: Active borrow, not overdue (Emma borrowed Hobbit 5 days ago, due in 9 days. Renew count = 0)
    record3 = BorrowRecord(
        user_id=m3.id,
        book_id=books[7].id,
        borrow_date=today - timedelta(days=5),
        due_date=today + timedelta(days=9),
        status='borrowed'
    )
    # Update copies_available for Hobbit (total is 4, default 4, let's keep it aligned: copies_available = copies_total - active_borrows)
    # The seeds defined copies_available manually above, so we adjust them here
    books[7].copies_available = books[7].copies_total - 1
    
    # Case D: Active borrow, renewed (David borrowed 1984 25 days ago, renewed once. Original due: 11 days ago, new due: 3 days from now)
    record4 = BorrowRecord(
        user_id=m4.id,
        book_id=books[2].id,
        borrow_date=today - timedelta(days=25),
        due_date=today + timedelta(days=3),
        status='renewed',
        renew_count=1
    )
    books[2].copies_available = books[2].copies_total - 1

    # Case E: Active borrow, overdue with PENDING fine (Lucas borrowed Educated 30 days ago, due 16 days ago. Return date is None. Overdue by 16 days. Fine: 16,000 UGX)
    record5 = BorrowRecord(
        user_id=m5.id,
        book_id=books[3].id,
        borrow_date=today - timedelta(days=30),
        due_date=today - timedelta(days=16),
        status='overdue'
    )
    books[3].copies_available = books[3].copies_total - 1
    db.session.add_all([record3, record4, record5])
    db.session.flush()
    
    fine_pending = Fine(
        borrow_record_id=record5.id,
        amount=16000.00,
        status='pending',
        created_at=datetime.utcnow() - timedelta(days=16)
    )
    db.session.add(fine_pending)
    
    # Case F: Additional historical records for richer chart curves
    # Add records for each of the last 5 months
    months_offsets = [150, 120, 90, 60, 30, 10]
    users_list = [m1, m2, m3, m4, m5]
    for idx, offset in enumerate(months_offsets):
        # Even indices returned on time, odd returned late
        user = users_list[idx % len(users_list)]
        book = books[idx % len(books)]
        
        borrow_date = today - timedelta(days=offset)
        due_date = borrow_date + timedelta(days=14)
        
        if idx % 2 == 0:
            # On time return
            return_date = borrow_date + timedelta(days=10)
            rec = BorrowRecord(
                user_id=user.id,
                book_id=book.id,
                borrow_date=borrow_date,
                due_date=due_date,
                return_date=return_date,
                status='returned'
            )
            db.session.add(rec)
        else:
            # Late return
            return_date = borrow_date + timedelta(days=20)
            rec = BorrowRecord(
                user_id=user.id,
                book_id=book.id,
                borrow_date=borrow_date,
                due_date=due_date,
                return_date=return_date,
                status='returned'
            )
            db.session.add(rec)
            db.session.flush()
            
            # Late by 6 days: 6,000 UGX fine paid
            f = Fine(
                borrow_record_id=rec.id,
                amount=6000.00,
                status='paid',
                created_at=datetime.utcnow() - timedelta(days=offset - 14),
                paid_at=datetime.utcnow() - timedelta(days=offset - 20)
            )
            db.session.add(f)
            
    # Some other active loans to adjust copies available
    # Gatsby (total 4, available 2) -> Let's make Sarah borrow it actively
    record6 = BorrowRecord(
        user_id=m1.id,
        book_id=books[0].id,
        borrow_date=today - timedelta(days=3),
        due_date=today + timedelta(days=11),
        status='borrowed'
    )
    # Sapiens (total 3, available 1) -> Sarah borrows this too
    record7 = BorrowRecord(
        user_id=m1.id,
        book_id=books[4].id,
        borrow_date=today - timedelta(days=2),
        due_date=today + timedelta(days=12),
        status='borrowed'
    )
    # Brave New World (total 2, available 1) -> Emma borrows
    record8 = BorrowRecord(
        user_id=m3.id,
        book_id=books[10].id,
        borrow_date=today - timedelta(days=1),
        due_date=today + timedelta(days=13),
        status='borrowed'
    )
    
    db.session.add_all([record6, record7, record8])
    db.session.commit()
    print("Database seeding completed successfully!")

if __name__ == '__main__':
    with app.app_context():
        seed_database()
