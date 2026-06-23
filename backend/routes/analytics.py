from flask import Blueprint, jsonify
from backend.models import db, Book, User, BorrowRecord, Fine
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from collections import defaultdict
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    role = user.role
    
    # 1. Base stats
    if role == 'librarian':
        total_books = Book.query.count()
        total_members = User.query.filter_by(role='member').count()
        active_loans = BorrowRecord.query.filter(BorrowRecord.return_date == None).count()
        overdue_loans = BorrowRecord.query.filter(BorrowRecord.status == 'overdue', BorrowRecord.return_date == None).count()
        
        # Outstanding fines
        total_fines_pending = db.session.query(func.sum(Fine.amount)).filter_by(status='pending').scalar() or 0.0
        total_fines_paid = db.session.query(func.sum(Fine.amount)).filter_by(status='paid').scalar() or 0.0
        
        stats = {
            'role': 'librarian',
            'summary': {
                'total_books': total_books,
                'total_members': total_members,
                'active_loans': active_loans,
                'overdue_loans': overdue_loans,
                'outstanding_fines': round(total_fines_pending, 2),
                'fines_collected': round(total_fines_paid, 2)
            }
        }
    else:
        # Member stats
        my_active_loans = BorrowRecord.query.filter_by(user_id=user_id, return_date=None).count()
        my_overdue_loans = BorrowRecord.query.filter_by(user_id=user_id, status='overdue', return_date=None).count()
        my_total_borrows = BorrowRecord.query.filter_by(user_id=user_id).count()
        
        # Outstanding fines
        my_fines_pending = db.session.query(func.sum(Fine.amount))\
            .join(BorrowRecord)\
            .filter(BorrowRecord.user_id == user_id, Fine.status == 'pending')\
            .scalar() or 0.0
            
        stats = {
            'role': 'member',
            'summary': {
                'active_loans': my_active_loans,
                'overdue_loans': my_overdue_loans,
                'total_borrows': my_total_borrows,
                'outstanding_fines': round(my_fines_pending, 2)
            }
        }
        
    # 2. Charts Data (Combined or scoped)
    # 2a. Borrowing activity over the last 6 months
    today = datetime.utcnow().date()
    six_months_ago = today - timedelta(days=180)
    
    borrow_query = BorrowRecord.query.filter(BorrowRecord.borrow_date >= six_months_ago)
    if role != 'librarian':
        borrow_query = borrow_query.filter_by(user_id=user_id)
        
    borrows = borrow_query.all()
    
    # Group by month
    monthly_counts = defaultdict(int)
    for b in borrows:
        month_str = b.borrow_date.strftime('%Y-%m') # "2026-06"
        monthly_counts[month_str] += 1
        
    # Generate list of last 6 months in order
    month_list = []
    for i in range(5, -1, -1):
        m_date = today - timedelta(days=i*30)
        m_key = m_date.strftime('%Y-%m')
        m_label = m_date.strftime('%b')
        month_list.append({
            'month': m_label,
            'key': m_key,
            'borrows': monthly_counts[m_key]
        })
        
    stats['borrow_trends'] = month_list
    
    # 2b. Popular books (Librarian only or system-wide for recommendation)
    # Query book join borrow_record and count borrows
    popular_books_query = db.session.query(
        Book.title, func.count(BorrowRecord.id).label('borrow_count')
    ).join(BorrowRecord).group_by(Book.id).order_by(func.count(BorrowRecord.id).desc()).limit(5).all()
    
    stats['popular_books'] = [
        {'title': r[0], 'borrows': r[1]} for r in popular_books_query
    ]
    
    # 2c. Genre distribution of library books
    genre_query = db.session.query(
        Book.genre, func.count(Book.id)
    ).group_by(Book.genre).all()
    
    stats['genre_distribution'] = [
        {'genre': r[0] if r[0] else 'Unknown', 'value': r[1]} for r in genre_query
    ]
    
    # 2d. Status distribution of active borrows (borrowed vs overdue)
    active_borrows_query = BorrowRecord.query.filter(BorrowRecord.return_date == None)
    if role != 'librarian':
        active_borrows_query = active_borrows_query.filter_by(user_id=user_id)
        
    status_counts = defaultdict(int)
    for b in active_borrows_query.all():
        status_counts[b.status] += 1
        
    stats['status_distribution'] = [
        {'name': 'Borrowed', 'value': status_counts['borrowed']},
        {'name': 'Renewed', 'value': status_counts['renewed']},
        {'name': 'Overdue', 'value': status_counts['overdue']}
    ]
    
    return jsonify(stats), 200

@analytics_bp.route('/members', methods=['GET'])
@jwt_required()
def get_members_directory():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'librarian':
        return jsonify({'error': 'Unauthorized. Librarian privileges required.'}), 403
        
    members = User.query.filter_by(role='member').all()
    
    member_list = []
    for member in members:
        # Count active, returned, and overdue loans
        active_count = BorrowRecord.query.filter_by(user_id=member.id, return_date=None).count()
        overdue_count = BorrowRecord.query.filter_by(user_id=member.id, status='overdue', return_date=None).count()
        
        # Outstanding fines
        fines_pending = db.session.query(func.sum(Fine.amount))\
            .join(BorrowRecord)\
            .filter(BorrowRecord.user_id == member.id, Fine.status == 'pending')\
            .scalar() or 0.0
            
        member_list.append({
            **member.to_dict(),
            'active_loans_count': active_count,
            'overdue_loans_count': overdue_count,
            'outstanding_fines': round(fines_pending, 2)
        })
        
    return jsonify({'members': member_list}), 200
