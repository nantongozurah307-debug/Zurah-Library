# User Manual: Bibliotech - Public Library Tracker

Welcome to **Bibliotech**! This guide is designed to help you onboard and navigate the library circulation tracking system. 

---

## 1. Credentials for Quick Demo Testing

The database comes pre-seeded with mock profiles. You can use these credentials to log in:

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Librarian (Admin)** | `librarian1` | `password` | Complete access to library desks, inventory editing, and global charts. |
| **Member (Borrower)** | `sarah_jones` | `password` | Personal bookshelf access, fine payments, and catalog borrowing. |

---

## 2. Onboarding: Librarian Role

The Librarian dashboard is designed to provide high-level statistics and administrative controls.

### Step 2.1: Controls & Dashboard
- Upon logging in, you will be redirected to the **Library Control Panel**.
- Review system stats: **Total Catalog**, **Total Members**, **Active Loans**, and **Overdue Loans** (flashing red if overdue items exist).
- Inspect the financial meters showing **Outstanding Unpaid Fines** versus **Fines Paid/Collected**.
- Check library charts showing historical borrow rates, active borrow statuses, popular books, and catalog genre distributions.

### Step 2.2: Add or Edit Books in the Catalog
- Click **Books Inventory** in the sidebar.
- Click the violet **Add New Book** button.
- Fill out the form (Title, Author, ISBN, Genre, Published Year, Stock Copies, Cover Image URL) and submit.
- To modify book details, click **Edit** on any book card. To remove a book, click **Delete** (only books with no active borrowings can be deleted).

### Step 2.3: Check-Out and Check-In (Circulation Desk)
- Click **Circulation Portal** in the sidebar.
- **To Check-Out**:
  1. Under the **Check-Out Desk**, select a **Library Member** from the dropdown.
  2. Select an **Available Book** from the catalog search dropdown.
  3. Click **Complete Checkout**. The book's stock will decrement and a loan record will be generated.
- **To Check-In (Return)**:
  1. Locate the active loan under the **Active Loans** tab.
  2. Click the green **Return** button.
  3. If returned late, a fine will be calculated and displayed under the member's profile.

### Step 2.4: Settle & Waive Fines
- Click **Fines & Payments** in the sidebar.
- Librarians can view all system fines.
- To waive a fine, click **Waive** (this clears the balance). To register a cash payment at the front desk, click **Pay Fine**.

---

## 3. Onboarding: Member Role

The Member portal is optimized for self-service book lookup, loan extensions, and checking fine sheets.

### Step 3.1: Member Dashboard
- Log in as a Member (e.g. `sarah_jones`).
- Review your personalized counters: **Currently Borrowed**, **Total Reads**, **Overdue Books**, and **Outstanding Fines**.
- Review your active books. You can check the due date and check if a fine is accumulating.

### Step 3.2: Book Extensions (Renewals)
- You can extend your borrowing period by 14 days by clicking **Renew**.
- Members can renew a book up to **2 times** if it is not already overdue. If a book is overdue, contact a Librarian.

### Step 3.3: Self-Service Kiosk (Self Return)
- For testing purposes, members can return their borrowed books directly by clicking the green **Check In (Self)** button on their dashboard.
- This immediately returns the book back to the library stock.

### Step 3.4: Settle Fines
- Click **Fines & Payments** in the sidebar to review your account details.
- To settle any outstanding fine, click **Pay Fine**. This will simulate a checkout payment and mark the fee as settled.
- Note: New borrowings will be blocked if your unpaid balance exceeds **20,000 UGX**.
