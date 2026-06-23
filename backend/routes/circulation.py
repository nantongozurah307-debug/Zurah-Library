from flask import Blueprint, request, jsonify
from backend.models import db, Book, User, BorrowRecord, Fine
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from backend.config import Config

circulation_bp = Blueprint('circulation', __name__)

def update_overdue_and_fines():
    """
    Sweeps active loans to set 'overdue' status and compute fine amounts.
    Runs dynamically on circulation actions and dashboard loads.
    """
    today = datetime.utcnow().date()
    # Find active borrow records that are past due
    overdue_records = BorrowRecord.query.filter(
        BorrowRecord.return_date == None,
        BorrowRecord.due_date < today
    ).all()
    
    for record in overdue_records:
        record.status = 'overdue'
        
        # Calculate days overdue
        days_late = (today - record.due_date).days
        fine_amount = days_late * Config.FINE_RATE_PER_DAY
        
        # Cap fine based on config
        fine_amount = min(fine_amount, Config.MAX_FINE_AMOUNT)
        
        # Check if fine record exists
        fine = Fine.query.filter_by(borrow_record_id=record.id).first()
        if not fine:
            fine = Fine(borrow_record_id=record.id, amount=fine_amount, status='pending')
            db.session.add(fine)
        elif fine.status == 'pending':
            fine.amount = fine_amount
            
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error sweeping overdues: {str(e)}")

@circulation_bp.route('/loans', methods=['GET'])
@jwt_required()
def get_loans():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    role = user.role
    
    status_filter = request.args.get('status', '').strip()
    
    query = BorrowRecord.query
    
    # RBAC: Members only see their own borrows. Librarians see all.
    if role != 'librarian':
        query = query.filter_by(user_id=user_id)
    else:
        # Librarians can filter by specific user
        member_id = request.args.get('user_id')
        if member_id:
            query = query.filter_by(user_id=member_id)
            
    if status_filter:
        if status_filter == 'active':
            query = query.filter(BorrowRecord.return_date == None)
        elif status_filter == 'overdue':
            query = query.filter(BorrowRecord.status == 'overdue', BorrowRecord.return_date == None)
        elif status_filter == 'returned':
            query = query.filter(BorrowRecord.return_date != None)
            
    search_query = request.args.get('search', '').strip()
    if search_query:
        query = query.join(Book).join(User).filter(
            db.or_(Book.title.ilike(f'%{search_query}%'), User.username.ilike(f'%{search_query}%'))
        )
            
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    pagination = query.order_by(BorrowRecord.borrow_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'loans': [loan.to_dict() for loan in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200

@circulation_bp.route('/borrow', methods=['POST'])
@jwt_required()
def borrow_book():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found.'}), 404
    role = current_user.role
    
    data = request.get_json() or {}
    book_id = data.get('book_id')
    
    # Librarian can borrow on behalf of a member by providing member_id
    target_user_id = current_user_id
    if role == 'librarian' and 'user_id' in data:
        target_user_id = data.get('user_id')
        
    if not book_id:
        return jsonify({'error': 'book_id is required.'}), 400
        
    book = Book.query.with_for_update().get(book_id)
    if not book:
        return jsonify({'error': 'Book not found.'}), 404
        
    user = User.query.get(target_user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
        
    # Validation 1: Check availability
    if book.copies_available <= 0:
        return jsonify({'error': 'No physical copies available for checkout.'}), 400
        
    # Validation 2: Check active loan count limits
    active_loans = BorrowRecord.query.filter_by(user_id=target_user_id, return_date=None).count()
    if active_loans >= Config.MAX_ACTIVE_BORROWS:
        return jsonify({'error': f'Member has reached borrowing limit of {Config.MAX_ACTIVE_BORROWS} books.'}), 400
        
    # Validation 3: Check unpaid fines restriction (block if member has outstanding fines)
    pending_fines = Fine.query.join(BorrowRecord).filter(
        BorrowRecord.user_id == target_user_id,
        Fine.status == 'pending'
    ).all()
    
    total_fines = sum(fine.amount for fine in pending_fines)
    if total_fines > Config.BLOCK_BORROW_THRESHOLD:  # Allow some leniency
        return jsonify({'error': f'Borrowing blocked. Member has {total_fines:,.0f} UGX in unpaid fines.'}), 400
        
    # Validation 4: Ensure user doesn't currently borrow the exact same book
    existing_loan = BorrowRecord.query.filter_by(
        user_id=target_user_id,
        book_id=book_id,
        return_date=None
    ).first()
    if existing_loan:
        return jsonify({'error': 'Member is already borrowing this book.'}), 400
        
    # Checkout logic
    today = datetime.utcnow().date()
    due_date = today + timedelta(days=14)
    
    book.copies_available -= 1
    record = BorrowRecord(
        user_id=target_user_id,
        book_id=book_id,
        borrow_date=today,
        due_date=due_date,
        status='borrowed'
    )
    
    try:
        db.session.add(record)
        db.session.commit()
        return jsonify({
            'message': 'Book checked out successfully.',
            'loan': record.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@circulation_bp.route('/renew/<int:record_id>', methods=['POST'])
@jwt_required()
def renew_book(record_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found.'}), 404
    role = current_user.role
    
    record = BorrowRecord.query.get_or_404(record_id)
    
    # RBAC: Member can only renew their own loans
    if role != 'librarian' and record.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized. Cannot renew another member\'s loan.'}), 403
        
    # Validation 1: Already returned
    if record.return_date is not None:
        return jsonify({'error': 'Cannot renew a book that has already been returned.'}), 400
        
    # Validation 2: Renewal limit reached
    if record.renew_count >= Config.MAX_RENEWALS:
        return jsonify({'error': f'Maximum renewal limit ({Config.MAX_RENEWALS}) reached.'}), 400
        
    # Validation 3: Overdue restriction (Librarians can override, members cannot renew overdue books)
    if record.status == 'overdue' and role != 'librarian':
        return jsonify({'error': 'Cannot renew an overdue book. Please contact a librarian or settle fines first.'}), 400
        
    # Renewal logic
    record.due_date = record.due_date + timedelta(days=14)
    record.renew_count += 1
    record.status = 'renewed'
    
    # If librarian overrides an overdue loan, let's keep the fine record but pause or clear it? 
    # Usually, we recalculate or resolve. For simplicity, reset status to renewed.
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Loan renewed successfully.',
            'loan': record.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@circulation_bp.route('/return/<int:record_id>', methods=['POST'])
@jwt_required()
def return_book(record_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found.'}), 404
    role = current_user.role
    
    record = BorrowRecord.query.get_or_404(record_id)
    
    # RBAC: Members can return their own book (self-service checkout/return portal is enabled for testing).
    if role != 'librarian' and record.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized.'}), 403
        
    if record.return_date is not None:
        return jsonify({'error': 'Book has already been returned.'}), 400
        
    today = datetime.utcnow().date()
    record.return_date = today
    
    # Increment book copies
    record.book.copies_available = min(record.book.copies_available + 1, record.book.copies_total)
    
    # Freeze the fine if overdue
    if today > record.due_date:
        days_late = (today - record.due_date).days
        fine_amount = min(days_late * Config.FINE_RATE_PER_DAY, Config.MAX_FINE_AMOUNT)
        
        record.status = 'overdue'  # remains marked as overdue loan to indicate historical late return
        
        fine = Fine.query.filter_by(borrow_record_id=record.id).first()
        if not fine:
            fine = Fine(borrow_record_id=record.id, amount=fine_amount, status='pending')
            db.session.add(fine)
        elif fine.status == 'pending':
            fine.amount = fine_amount
    else:
        record.status = 'returned'
        
    try:
        db.session.commit()
        return jsonify({
            'message': 'Book returned successfully.',
            'loan': record.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@circulation_bp.route('/fines', methods=['GET'])
@jwt_required()
def get_fines():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found.'}), 404
    role = current_user.role
    user_id = current_user_id
    
    query = Fine.query.join(BorrowRecord)
    
    if role != 'librarian':
        query = query.filter(BorrowRecord.user_id == user_id)
        
    status_filter = request.args.get('status', '').strip()
    if status_filter:
        query = query.filter(Fine.status == status_filter)
        
    fines = query.order_by(Fine.created_at.desc()).all()
    
    return jsonify({
        'fines': [
            {
                **fine.to_dict(),
                'book_title': fine.borrow_record.book.title,
                'username': fine.borrow_record.user.username,
                'due_date': fine.borrow_record.due_date.isoformat(),
                'return_date': fine.borrow_record.return_date.isoformat() if fine.borrow_record.return_date else None
            } for fine in fines
        ]
    }), 200

@circulation_bp.route('/fines/pay/<int:fine_id>', methods=['POST'])
@jwt_required()
def pay_fine(fine_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found.'}), 404
    role = current_user.role
    user_id = current_user_id
    
    fine = Fine.query.get_or_404(fine_id)
    
    # Check if this fine belongs to the user (or if admin)
    if role != 'librarian' and fine.borrow_record.user_id != user_id:
        return jsonify({'error': 'Unauthorized.'}), 403
        
    if fine.status == 'paid':
        return jsonify({'error': 'Fine is already paid.'}), 400
        
    fine.status = 'paid'
    fine.paid_at = datetime.utcnow()
    
    # If the book has already been returned, we update status to returned
    if fine.borrow_record.return_date is not None:
        fine.borrow_record.status = 'returned'
        
    try:
        db.session.commit()
        return jsonify({
            'message': 'Fine paid successfully.',
            'fine': fine.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@circulation_bp.route('/fines/waive/<int:fine_id>', methods=['POST'])
@jwt_required()
def waive_fine(fine_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'librarian':
        return jsonify({'error': 'Unauthorized. Librarian privileges required.'}), 403
        
    fine = Fine.query.get_or_404(fine_id)
    
    if fine.borrow_record.return_date is None:
        return jsonify({'error': 'Cannot waive fine for an unreturned book.'}), 400
    
    try:
        db.session.delete(fine)
        if fine.borrow_record.return_date is not None:
            fine.borrow_record.status = 'returned'
        else:
            # If active but fine waived, keep status as overdue but reset fine
            fine.borrow_record.status = 'borrowed'
            
        db.session.commit()
        return jsonify({'message': 'Fine waived successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
