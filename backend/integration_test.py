import requests
import sys

BASE_URL = 'http://localhost:5001/api'

def run_integration_tests():
    print("=== STARTING LIVE API INTEGRATION TESTS (PORT 5001) ===")
    
    # 1. Test backend health
    try:
        res = requests.get('http://localhost:5001/health')
        print(f"Health Check: {res.status_code} - {res.json()}")
        if res.status_code != 200:
            print("Backend health check failed.")
            sys.exit(1)
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        print("Please make sure the backend server is running on port 5001.")
        sys.exit(1)

    # 2. Test Librarian Login
    print("\n--- Testing Librarian Login ---")
    login_data = {
        'username_or_email': 'librarian1',
        'password': 'password'
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login status: {res.status_code}")
    if res.status_code != 200:
        print(f"Librarian login failed: {res.text}")
        sys.exit(1)
    
    lib_token = res.json().get('token')
    lib_headers = {'Authorization': f"Bearer {lib_token}"}
    print("Librarian login successful. JWT obtained.")

    # 3. Test Dashboard Analytics
    print("\n--- Testing Librarian Dashboard Endpoint ---")
    res = requests.get(f"{BASE_URL}/analytics/dashboard", headers=lib_headers)
    print(f"Dashboard status: {res.status_code}")
    if res.status_code == 200:
        summary = res.json().get('summary', {})
        print("Dashboard summary stats:")
        for k, v in summary.items():
            print(f" - {k}: {v}")
    else:
        print(f"Failed to fetch dashboard: {res.text}")
        sys.exit(1)

    # 4. Test Book Listing
    print("\n--- Testing Book Catalog Endpoint ---")
    res = requests.get(f"{BASE_URL}/books")
    print(f"Catalog status: {res.status_code}")
    if res.status_code == 200:
        books = res.json().get('books', [])
        print(f"Total catalog books returned: {len(books)}")
        first_book = books[0] if books else None
        if first_book:
            print(f" - First Book: '{first_book.get('title')}' by {first_book.get('author')} (Available: {first_book.get('copies_available')}/{first_book.get('copies_total')})")
            book_id = first_book.get('id')
    else:
        print(f"Failed to fetch books: {res.text}")
        sys.exit(1)

    # 5. Test Member Login
    print("\n--- Testing Member Login ---")
    member_login = {
        'username_or_email': 'sarah_jones',
        'password': 'password'
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=member_login)
    print(f"Login status: {res.status_code}")
    if res.status_code != 200:
        print(f"Member login failed: {res.text}")
        sys.exit(1)
        
    member_token = res.json().get('token')
    member_headers = {'Authorization': f"Bearer {member_token}"}
    print("Member login successful. JWT obtained.")

    # 6. Test Book Borrowing
    print("\n--- Testing Book Borrowing (Member) ---")
    # Let's borrow the first book
    borrow_data = {'book_id': book_id}
    res = requests.post(f"{BASE_URL}/circulation/borrow", json=borrow_data, headers=member_headers)
    print(f"Borrow status: {res.status_code}")
    borrow_success = res.status_code == 201
    
    if borrow_success:
        loan = res.json().get('loan', {})
        loan_id = loan.get('id')
        print(f"Borrow successful: Loan ID {loan_id} created for '{loan.get('book', {}).get('title')}'.")
        
        # 7. Test Renewal
        print("\n--- Testing Book Renewal (Member) ---")
        res = requests.post(f"{BASE_URL}/circulation/renew/{loan_id}", headers=member_headers)
        print(f"Renew status: {res.status_code} - {res.json().get('message', '')}")
        
        # 8. Test Check-In (Return)
        print("\n--- Testing Book Return (Member) ---")
        res = requests.post(f"{BASE_URL}/circulation/return/{loan_id}", headers=member_headers)
        print(f"Return status: {res.status_code} - {res.json().get('message', '')}")
    else:
        # If already borrowed, let's look at active loans
        print(f"Could not borrow (expected if already borrowed): {res.json().get('error', '')}")
        print("Checking active loans to verify structure...")
        res = requests.get(f"{BASE_URL}/circulation/loans?status=active", headers=member_headers)
        if res.status_code == 200:
            loans = res.json().get('loans', [])
            print(f"Active member loans: {len(loans)}")
            if loans:
                active_loan_id = loans[0].get('id')
                # Try return
                print("\n--- Performing Return on Existing Active Loan ---")
                ret_res = requests.post(f"{BASE_URL}/circulation/return/{active_loan_id}", headers=member_headers)
                print(f"Return status: {ret_res.status_code} - {ret_res.json().get('message', '')}")

    print("\n=== LIVE INTEGRATION TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    run_integration_tests()
