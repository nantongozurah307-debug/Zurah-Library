from flask import Blueprint, request, jsonify
from backend.models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import re

auth_bp = Blueprint('auth', __name__)

# Basic email regex validation
EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'member')  # Default role is member
    
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required.'}), 400
        
    if role not in ['member', 'librarian']:
        return jsonify({'error': 'Invalid role specified. Must be member or librarian.'}), 400
        
    if not re.match(EMAIL_REGEX, email):
        return jsonify({'error': 'Invalid email address.'}), 400
        
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400
        
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username is already taken.'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email is already registered.'}), 400
        
    # Create new user
    new_user = User(username=username, email=email, role=role)
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Create token
        access_token = create_access_token(identity=str(new_user.id))
        
        return jsonify({
            'message': 'Registration successful.',
            'token': access_token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    
    username_or_email = data.get('username_or_email')
    password = data.get('password')
    
    if not username_or_email or not password:
        return jsonify({'error': 'Username/Email and password are required.'}), 400
        
    # Query user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials.'}), 401
        
    if not user.is_active:
        return jsonify({'error': 'User account has been deactivated.'}), 403
        
    # Generate access token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful.',
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
        
    return jsonify({'user': user.to_dict()}), 200
