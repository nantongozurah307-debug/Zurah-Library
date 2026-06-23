 # Bibliotech - Public Library circulation & overdue tracker

A premium, data-driven MVC web application designed to track book borrowings, manage circulation loops (borrowing, renewals, returns), calculate overdue flags, and track outstanding fine ledgers in Ugandan Shillings (UGX). Built with a Flask backend, SQLAlchemy ORM (SQLite3), and a modern React frontend utilizing Tailwind CSS and Recharts visualizations.

---

## How the System Works Under the Hood

To understand the core mechanisms of **Bibliotech**, here is a breakdown of the database relationships, business constraints, and standard workflows.

### 1. Database Entity Relations
The relational schema comprises four primary entities defined in [models.py](file:///Users/caleb/zurah/library/backend/models.py):
*   **User**: Represents library participants with a specified role (`librarian` or `member`).
*   **Book**: Stores catalog details including total copies vs. currently available physical stock.
*   **BorrowRecord**: Links a `User` to a `Book` for a specific borrowing period.
*   **Fine**: Linked to a late `BorrowRecord`, tracking unpaid or paid penalty balances.

```mermaid
erDiagram
    User ||--o{ BorrowRecord : "makes"
    Book ||--o{ BorrowRecord : "linked to"
    BorrowRecord ||--o? Fine : "generates"
```

### 2. Business Rules & System Constraints
The system enforces strict library guidelines defined in [config.py](file:///Users/caleb/zurah/library/backend/config.py):
*   **Borrowing Period**: All checkouts default to a **14-day** borrowing duration.
*   **Active Loan Limit**: A member can have at most **5 active loans** at any given time.
*   **Renewal Cap**: A loan can be renewed/extended by 14 days up to **2 times** maximum.
*   **Overdue Renewal Block**: Members are strictly blocked from renewing a book if it is already overdue. Only a librarian can override this.
*   **Daily Fine Rate**: Overdue books accumulate a fine of **`1,000 UGX` per day**.
*   **Fine Cap**: Fines are capped at a maximum of **`30,000 UGX`** per borrow record.
*   **Borrowing Block Threshold**: If a member's total outstanding unpaid fines exceed **`20,000 UGX`**, the checkout desk automatically blocks them from borrowing new books.
*   **Waiver Safeguard**: Fines can only be waived by a librarian *after* the book has actually been returned.

### 3. Core Operational Workflows
*   **Checkout Desk**: When checking out a book, the system decrements `copies_available` in the `Book` table and creates a `BorrowRecord` with a due date set to `today + 14 days`.
*   **Return (Check-in) Desk**: When returning a book, the system increments `copies_available` in the `Book` table, logs the `return_date`, and calculates any overdue fines. If returned late, a `Fine` record is initialized with a `pending` status.
*   **Scheduled Overdue & Fine Sweeps**: A daily scheduled job run at **`00:00`** via `Flask-APScheduler` scans active borrows where `due_date < today`. It flags records as `overdue` and updates the accrued fine amounts in the database.
*   **Fine Settlements**: Members can pay outstanding fines via a simulated payment gateway, and librarians can waive fees once books are checked in.

---

## Directory Structure
```
/
├── backend/                  # Flask REST API
│   ├── routes/               # Blueprint routes
│   │   ├── auth.py           # Registration & login
│   │   ├── books.py          # Book catalog CRUD
│   │   ├── circulation.py    # Checkout, return, renew, fines
│   │   └── analytics.py      # Charts aggregator & members dir
│   ├── app.py                # Main server entrypoint
│   ├── config.py             # App configurations & settings
│   ├── models.py             # SQLAlchemy DB schemas
│   ├── seed.py               # Database populator script
│   └── test_app.py           # Backend unit test suite
│
├── frontend/                 # React client
│   ├── src/
│   │   ├── components/       # Layouts & wrappers
│   │   ├── context/          # Auth context and hooks
│   │   ├── pages/            # Page components (Dashboard, Catalog, etc.)
│   │   └── services/         # Axios API connection client
│   ├── index.html            # Entrypoint template
│   └── tailwind.config.js    # Tailwind configuration
│
├── TECHNICAL_REPORT.md       # Technical design report
├── USER_MANUAL.md            # Onboarding guides & credentials
└── README.md                 # Setup & run manual
```

---

## Prerequisites
- **Python 3.10+**
- **Node.js 18+**

---

## Running the Backend Locally

1. **Set up a virtual environment and install dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```

2. **Seed the database**:
   This clears existing tables, creates schemas, and populates 12 books, 7 members, and borrowing histories.
   ```bash
   python -m backend.seed
   ```

3. **Start the Flask server**:
   The backend will run on `http://localhost:5001`.
   ```bash
   python backend/app.py
   ```

---

## Running the Frontend Locally

1. **Install frontend dependencies**:
   *(Already completed in your workspace directory)*
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Vite development server**:
   The frontend will run on `http://localhost:3000` (proxied to `/api` on port `5001`).
   ```bash
   npm run dev
   ```

---

## Running Backend Tests
Ensure your virtual environment is active, then run:
```bash
python -m unittest backend/test_app.py
```

---

## Testing Roles (Seeded Accounts)
For a quick review of role constraints, use these logins:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Librarian (Admin)** | `librarian1` | `password` |
| **Member (Borrower)** | `sarah_jones` | `password` |

For a detailed walkthrough of the user interface steps, refer to [USER_MANUAL.md](file:///Users/caleb/zurah/library/USER_MANUAL.md). For database and system architecture details, refer to [TECHNICAL_REPORT.md](file:///Users/caleb/zurah/library/TECHNICAL_REPORT.md).

