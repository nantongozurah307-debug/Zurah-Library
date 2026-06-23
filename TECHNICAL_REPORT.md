# Technical Report: Bibliotech - Public Library Circulation & Overdue Tracker

**System Architecture, Database Design, Security & Visualization Pipelines**

---

## 1. Problem Statement & Context

Traditional library inventory management systems often treat cataloging and borrowing as static, decoupled records. This results in key operational issues:
- **Circulation Gaps**: Lack of automated tracking for the borrowing lifecycle (Checkout $\rightarrow$ Renewal $\rightarrow$ Returns).
- **Silent Overdue Loans**: The inability to sweep active records and flag overdue items dynamically, leading to unreturned assets and loss of inventory.
- **Manual Penalty Audits**: Fines are either not tracked or must be calculated manually by library staff upon return, leading to clerical errors.
- **Analytics Blindspots**: Administrators lack high-level visibility into catalog utilization, popular genres, and system-wide fine liabilities.

**Bibliotech** solves these problems by providing an MVC web application. It features an automated circulation indexer with dynamic overdue flags, fine ledgers, role-based controls, and graphical analytics.

---

## 2. Requirement Specifications

### Functional Requirements (FRs)
- **User Authentication & RBAC**: Safe user registration and login. Restrict control panel access based on system roles (`librarian` vs. `member`).
- **Catalog Management (CRUD)**: Librarians can Add, Update, and Delete books. Members can search and filter the catalog by title, author, ISBN, and genre.
- **Circulation Loops**: Support borrowing checking-out, self-service checks, returning checking-in, and renewal extensions (up to 2 times, extending due date by 14 days).
- **Overdue Flag Engine**: Automatically identify late borrowings and compute fines at a rate of `1,000 UGX` per day (capped at `30,000 UGX` per book).
- **Fine Payments**: Allow members to pay virtual fines and librarians to waive fees.
- **Data Visualizations**: Display interactive charts for borrow trends, genre distribution, loan statuses, and book popularity.

### Non-Functional Requirements (NFRs)
- **Security**: Password hashing using SHA-256 (via Werkzeug) and secure JSON Web Tokens (JWT) for stateless API authentication.
- **Performance**: Dynamic API responses and local SQLite connection handling with optimized indexes.
- **Usability**: Responsive glassmorphic layout optimized for both mobile viewports and desktop resolutions.

---

## 3. System Architecture

The application is structured under the Model-View-Controller (MVC) paradigm:

```mermaid
graph TD
    subgraph View "Vite + React (Frontend)"
        UI[Dashboard / Catalog / Circulation UI]
        API_C[Axios Client with JWT Interceptors]
    end
    subgraph Controller "Flask (Backend Controller)"
        Auth[Auth Blueprint]
        Circ[Circulation Blueprint]
        BookR[Books Blueprint]
        Anal[Analytics Blueprint]
    end
    subgraph Model "SQLAlchemy ORM (Data Layer)"
        M_User[User Model]
        M_Book[Book Model]
        M_Borrow[BorrowRecord Model]
        M_Fine[Fine Model]
    end
    subgraph Database "Storage"
        DB[(SQLite3 Database)]
    end

    UI <--> API_C
    API_C <--> Auth & Circ & BookR & Anal
    Auth & Circ & BookR & Anal <--> M_User & M_Book & M_Borrow & M_Fine
    M_User & M_Book & M_Borrow & M_Fine <--> DB
```

---

## 4. Database Schema & Entity-Relationship Diagram (ERD)

The relational schema is implemented in SQLite3 and managed using SQLAlchemy ORM.

### Database Tables Layout
1. **users**: Stores user credentials, roles, and status flags.
2. **books**: Stores book catalog details and tracks stock counts.
3. **borrow_records**: Connects users to books, tracking borrow dates, due dates, return dates, renew counts, and status loops.
4. **fines**: Tracks penalty fee balances, statuses (`pending` vs. `paid`), and payment timestamps.

```mermaid
erDiagram
    users {
        int id PK
        string username UNIQUE
        string email UNIQUE
        string password_hash
        string role
        datetime created_at
        boolean is_active
    }
    books {
        int id PK
        string title
        string author
        string isbn UNIQUE
        string genre
        int published_year
        int copies_total
        int copies_available
        string cover_image_url
        datetime created_at
    }
    borrow_records {
        int id PK
        int user_id FK
        int book_id FK
        date borrow_date
        date due_date
        date return_date
        string status
        int renew_count
    }
    fines {
        int id PK
        int borrow_record_id FK
        float amount
        string status
        datetime created_at
        datetime paid_at
    }

    users ||--o{ borrow_records : "borrows"
    books ||--o{ borrow_records : "borrowed in"
    borrow_records ||--o| fines : "incurs"
```

---

## 5. ORM Transaction Examples

SQLAlchemy handles all database transactions. Below are typical ORM transaction implementations.

### Transaction A: Checking Out a Book
Ensures atomic checks of inventory stock, loan limits, unpaid fine limits, and decreases stock counts.
```python
@db.transaction
def borrow_book(user_id, book_id):
    # Retrieve book with write lock
    book = Book.query.with_for_update().get(book_id)
    if book.copies_available <= 0:
        raise Exception("Out of stock")
        
    # Check loan limit
    active_loans = BorrowRecord.query.filter_by(user_id=user_id, return_date=None).count()
    if active_loans >= 5:
        raise Exception("Borrowing limit reached")
        
    # Checkout transaction
    book.copies_available -= 1
    new_loan = BorrowRecord(
        user_id=user_id,
        book_id=book_id,
        borrow_date=date.today(),
        due_date=date.today() + timedelta(days=14),
        status='borrowed'
    )
    db.session.add(new_loan)
    db.session.commit()
```

### Transaction B: Sweeping Overdues & Applying Fines
Triggers dynamically on system actions to recalculate fine sheets.
```python
def update_overdue_and_fines():
    today = date.today()
    # Find all unreturned books past their due date
    late_loans = BorrowRecord.query.filter(
        BorrowRecord.return_date == None,
        BorrowRecord.due_date < today
    ).all()
    
    for loan in late_loans:
        loan.status = 'overdue'
        days_late = (today - loan.due_date).days
        fine_amount = min(days_late * 1000.0, 30000.0) # Capped at 30,000 UGX
        
        fine = Fine.query.filter_by(borrow_record_id=loan.id).first()
        if not fine:
            fine = Fine(borrow_record_id=loan.id, amount=fine_amount, status='pending')
            db.session.add(fine)
        elif fine.status == 'pending':
            fine.amount = fine_amount
            
    db.session.commit()
```

---

## 6. Security & Role-Based Access Control (RBAC)

Security is implemented at two distinct levels:
1. **Stateless JWT Sessions**:
   Users obtain a signed access token upon successful authentication. The token contains their unique user ID in the subject (`sub`) claim. It expires in 2 hours.
2. **Endpoint Access Guarding**:
   Admin-only endpoints query the authenticated user's record from the database to check if `user.role == 'librarian'`. This prevents privilege escalation even if a client attempts to forge requests.

### Authentication Flow Diagram
```
Client                      Auth Blueprint                User Table
  |                               |                           |
  |--- POST /login -------------->|                           |
  |    {user, password}           |--- Query User ----------->|
  |                               |<-- Return Password Hash --|
  |                               |                           |
  |                               |--- Check Hash Match ------> [OK]
  |                               |--- Generate JWT (str ID)- |
  |<-- Return JWT & Profile ------|                           |
```

---

## 7. Data Visualization Pipeline

Analytics are retrieved via JSON API endpoints and rendered interactively on the frontend using Recharts.

```
+-----------------------------------+
|          Analytics API            |
| - Sums pending & paid fines       |
| - Groups loans by month (6 mos)   |
| - Counts books by genre           |
+-----------------------------------+
                 | (REST API JSON)
                 v
+-----------------------------------+
|         React Dashboard           |
| - Maps lists to SVG coordinates   |
| - Recharts Line & Pie components  |
+-----------------------------------+
```

- **Trends Line Graph**: Aggregates borrowing counts grouped by year-month for the last 6 months to render borrowing activity lines.
- **Loan Status Pie**: Displays the ratio of borrowed, renewed, and overdue books among all active loans.
- **Genre Distribution**: Renders a pie chart of books broken down by category.
- **Top 5 Borrowed Books**: Renders a horizontal bar chart displaying catalog utilization.

---

## 8. Cloud Deployment Guidelines

Although executed locally, Bibliotech is pre-configured for cloud hosting.

### Backend Hosting: Render
1. Create a Web Service on Render.
2. Link the GitHub Repository.
3. Configure settings:
   - Environment: `Python`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `gunicorn -w 4 -b 0.0.0.0:$PORT "backend.app:app"`
4. Add Environment Variables:
   - `SECRET_KEY`: A long random string.
   - `JWT_SECRET_KEY`: A long random string.
   - `DATABASE_URL`: Set to a PostgreSQL instance URL (e.g. Supabase) or omit to fall back to the default persistent SQLite path.

### Frontend Hosting: Vercel / Netlify
1. Create a Frontend Project on Vercel.
2. Set root directory to `frontend`.
3. Configure settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: Set to the Render Web Service backend URL.
