import os
# Set environment variable BEFORE importing app to force Flask-SQLAlchemy to bind to the test database
os.environ['DATABASE_URL'] = 'sqlite:///test_library.db'
os.environ['TESTING'] = 'true'

import unittest
import json
from datetime import datetime, date, timedelta
from backend.app import create_app
from backend.models import db, User, Book, BorrowRecord, Fine

class LibraryTestCase(unittest.TestCase):
    def setUp(self):
        # Create a fresh app instance for each test
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Setup mock librarian
            self.librarian = User(username="admin_test", email="admin@test.org", role="librarian")
            self.librarian.set_password("password")
            
            # Setup mock member
            self.member = User(username="member_test", email="member@test.org", role="member")
            self.member.set_password("password")
            
            # Setup mock book
            self.book = Book(
                title="Test Book",
                author="Test Author",
                isbn="1112223334",
                genre="Fiction",
                copies_total=2,
                copies_available=2
            )
            
            db.session.add_all([self.librarian, self.member, self.book])
            db.session.commit()
            
            # Store IDs for tests
            self.librarian_id = self.librarian.id
            self.member_id = self.member.id
            self.book_id = self.book.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        # Clean up database file
        db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_library.db')
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
            except Exception:
                pass

    def get_jwt_headers(self, username, password):
        """Helper to get JWT authorization headers for a user."""
        res = self.client.post('/api/auth/login', json={
            'username_or_email': username,
            'password': password
        })
        data = json.loads(res.data)
        token = data.get('token')
        return {'Authorization': f'Bearer {token}'}

    def test_auth_login(self):
        # Test valid login
        res = self.client.post('/api/auth/login', json={
            'username_or_email': 'member_test',
            'password': 'password'
        })
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'member')

        # Test invalid credentials
        res = self.client.post('/api/auth/login', json={
            'username_or_email': 'member_test',
            'password': 'wrong_password'
        })
        self.assertEqual(res.status_code, 401)

    def test_rbac_add_book(self):
        # 1. Member tries to add book -> Should fail 403
        member_headers = self.get_jwt_headers('member_test', 'password')
        res = self.client.post('/api/books', headers=member_headers, json={
            'title': 'Unauthorized Book',
            'author': 'No Author',
            'isbn': '9999999999',
            'copies_total': 1
        })
        self.assertEqual(res.status_code, 403)

        # 2. Librarian tries to add book -> Should succeed 201
        lib_headers = self.get_jwt_headers('admin_test', 'password')
        res = self.client.post('/api/books', headers=lib_headers, json={
            'title': 'Authorized Book',
            'author': 'Yes Author',
            'isbn': '9999999999',
            'copies_total': 3
        })
        self.assertEqual(res.status_code, 201)
        
        with self.app.app_context():
            book = Book.query.filter_by(isbn='9999999999').first()
            self.assertIsNotNone(book)
            self.assertEqual(book.copies_available, 3)

    def test_borrow_circulation(self):
        member_headers = self.get_jwt_headers('member_test', 'password')
        
        # 1. Member borrows book
        res = self.client.post('/api/circulation/borrow', headers=member_headers, json={
            'book_id': self.book_id
        })
        self.assertEqual(res.status_code, 201)
        
        with self.app.app_context():
            # Check copies decremented
            book = Book.query.get(self.book_id)
            self.assertEqual(book.copies_available, 1)
            
            # Check borrow record created
            loan = BorrowRecord.query.filter_by(user_id=self.member_id, book_id=self.book_id, return_date=None).first()
            self.assertIsNotNone(loan)
            self.assertEqual(loan.status, 'borrowed')
            self.assertEqual(loan.renew_count, 0)
            loan_id = loan.id

        # 2. Renew loan
        res = self.client.post(f'/api/circulation/renew/{loan_id}', headers=member_headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            loan = BorrowRecord.query.get(loan_id)
            self.assertEqual(loan.renew_count, 1)
            self.assertEqual(loan.status, 'renewed')

        # 3. Member returns book
        res = self.client.post(f'/api/circulation/return/{loan_id}', headers=member_headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            # Check copies incremented back to total
            book = Book.query.get(self.book_id)
            self.assertEqual(book.copies_available, 2)
            
            # Check borrow record updated
            loan = BorrowRecord.query.get(loan_id)
            self.assertIsNotNone(loan.return_date)
            self.assertEqual(loan.status, 'returned')

    def test_borrow_out_of_stock(self):
        lib_headers = self.get_jwt_headers('admin_test', 'password')
        member_headers = self.get_jwt_headers('member_test', 'password')
        
        # Borrow book twice (total copies = 2)
        self.client.post('/api/circulation/borrow', headers=member_headers, json={'book_id': self.book_id})
        self.client.post('/api/circulation/borrow', headers=lib_headers, json={'book_id': self.book_id, 'user_id': self.librarian_id})
        
        with self.app.app_context():
            book = Book.query.get(self.book_id)
            self.assertEqual(book.copies_available, 0)
            
        # Try to borrow third time -> Should fail 400
        res = self.client.post('/api/circulation/borrow', headers=member_headers, json={'book_id': self.book_id})
        self.assertEqual(res.status_code, 400)
        self.assertIn('No physical copies available', json.loads(res.data)['error'])

    def test_overdue_and_fine_calculation(self):
        # Create an manually expired loan in db
        with self.app.app_context():
            today = datetime.utcnow().date()
            overdue_date = today - timedelta(days=10) # 10 days past due
            
            record = BorrowRecord(
                user_id=self.member_id,
                book_id=self.book_id,
                borrow_date=today - timedelta(days=24),
                due_date=overdue_date,
                status='borrowed'
            )
            db.session.add(record)
            db.session.commit()
            
        # Trigger sweep manually as it's no longer fired on circulation requests
        from backend.routes.circulation import update_overdue_and_fines
        with self.app.app_context():
            update_overdue_and_fines()
            
        member_headers = self.get_jwt_headers('member_test', 'password')
        res = self.client.get('/api/circulation/loans', headers=member_headers)
        self.assertEqual(res.status_code, 200)
        
        with self.app.app_context():
            # Check status updated to overdue
            loan = BorrowRecord.query.filter_by(user_id=self.member_id, status='overdue').first()
            self.assertIsNotNone(loan)
            
            # Check fine created: 10 days * 1,000 UGX fine rate = 10,000 UGX
            fine = Fine.query.filter_by(borrow_record_id=loan.id).first()
            self.assertIsNotNone(fine)
            self.assertEqual(fine.amount, 10000.0)
            self.assertEqual(fine.status, 'pending')

if __name__ == '__main__':
    unittest.main()
