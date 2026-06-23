from flask import Blueprint, request, jsonify
from backend.models import db, Book, User
from flask_jwt_extended import jwt_required, get_jwt_identity

books_bp = Blueprint('books', __name__)

def require_librarian(user_id):
    user = User.query.get(user_id)
    return user is not None and user.role == 'librarian'

@books_bp.route('', methods=['GET'])
def get_books():
    search_query = request.args.get('search', '').strip()
    genre_query = request.args.get('genre', '').strip()
    available_only = request.args.get('available_only', 'false').lower() == 'true'
    
    query = Book.query
    
    if search_query:
        query = query.filter(
            Book.title.ilike(f'%{search_query}%') |
            Book.author.ilike(f'%{search_query}%') |
            Book.isbn.ilike(f'%{search_query}%')
        )
        
    if genre_query:
        query = query.filter(Book.genre.ilike(genre_query))
        
    if available_only:
        query = query.filter(Book.copies_available > 0)
        
    books = query.all()
    
    # Get distinct genres for the filter dropdown
    genres = [r[0] for r in db.session.query(Book.genre).distinct().all() if r[0]]
    
    return jsonify({
        'books': [book.to_dict() for book in books],
        'genres': genres
    }), 200

@books_bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify({'book': book.to_dict()}), 200

@books_bp.route('', methods=['POST'])
@jwt_required()
def add_book():
    user_id = int(get_jwt_identity())
    if not require_librarian(user_id):
        return jsonify({'error': 'Unauthorized. Librarian privileges required.'}), 403
        
    data = request.get_json() or {}
    
    title = data.get('title')
    author = data.get('author')
    isbn = data.get('isbn')
    genre = data.get('genre', 'General')
    published_year = data.get('published_year')
    copies_total = data.get('copies_total', 1)
    cover_image_url = data.get('cover_image_url', '')
    
    if not title or not author or not isbn:
        return jsonify({'error': 'Title, Author, and ISBN are required.'}), 400
        
    # Check ISBN uniqueness
    if Book.query.filter_by(isbn=isbn).first():
        return jsonify({'error': 'A book with this ISBN already exists.'}), 400
        
    try:
        copies_total = int(copies_total)
        if copies_total < 1:
            raise ValueError()
    except ValueError:
        return jsonify({'error': 'copies_total must be an integer >= 1.'}), 400
        
    try:
        published_year = int(published_year) if published_year else None
    except ValueError:
        return jsonify({'error': 'published_year must be an integer.'}), 400
        
    new_book = Book(
        title=title,
        author=author,
        isbn=isbn,
        genre=genre,
        published_year=published_year,
        copies_total=copies_total,
        copies_available=copies_total,
        cover_image_url=cover_image_url
    )
    
    try:
        db.session.add(new_book)
        db.session.commit()
        return jsonify({
            'message': 'Book added successfully.',
            'book': new_book.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@books_bp.route('/<int:book_id>', methods=['PUT'])
@jwt_required()
def update_book(book_id):
    user_id = int(get_jwt_identity())
    if not require_librarian(user_id):
        return jsonify({'error': 'Unauthorized. Librarian privileges required.'}), 403
        
    book = Book.query.get_or_404(book_id)
    data = request.get_json() or {}
    
    title = data.get('title')
    author = data.get('author')
    isbn = data.get('isbn')
    genre = data.get('genre')
    published_year = data.get('published_year')
    copies_total = data.get('copies_total')
    cover_image_url = data.get('cover_image_url')
    
    if isbn and isbn != book.isbn:
        # Check uniqueness of new ISBN
        if Book.query.filter_by(isbn=isbn).first():
            return jsonify({'error': 'A book with this ISBN already exists.'}), 400
        book.isbn = isbn
        
    if title:
        book.title = title
    if author:
        book.author = author
    if genre:
        book.genre = genre
    if cover_image_url is not None:
        book.cover_image_url = cover_image_url
        
    if published_year is not None:
        try:
            book.published_year = int(published_year)
        except ValueError:
            return jsonify({'error': 'published_year must be an integer.'}), 400
            
    if copies_total is not None:
        try:
            new_total = int(copies_total)
            if new_total < 0:
                raise ValueError()
                
            # Calculate difference
            diff = new_total - book.copies_total
            new_available = book.copies_available + diff
            
            if new_available < 0:
                return jsonify({'error': 'Cannot reduce total copies below active loans.'}), 400
                
            book.copies_total = new_total
            book.copies_available = new_available
        except ValueError:
            return jsonify({'error': 'copies_total must be a positive integer.'}), 400
            
    try:
        db.session.commit()
        return jsonify({
            'message': 'Book updated successfully.',
            'book': book.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@books_bp.route('/<int:book_id>', methods=['DELETE'])
@jwt_required()
def delete_book(book_id):
    user_id = int(get_jwt_identity())
    if not require_librarian(user_id):
        return jsonify({'error': 'Unauthorized. Librarian privileges required.'}), 403
        
    book = Book.query.get_or_404(book_id)
    
    # Check if there are active loans
    active_loans = Book.query.join(Book.borrows).filter(
        Book.id == book_id,
        Book.borrows.has(return_date=None)
    ).first()
    
    if active_loans:
        return jsonify({'error': 'Cannot delete a book that is currently borrowed.'}), 400
        
    try:
        db.session.delete(book)
        db.session.commit()
        return jsonify({'message': 'Book deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
