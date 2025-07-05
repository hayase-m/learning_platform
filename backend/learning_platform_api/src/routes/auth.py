from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash
from src.models.user import User, db
import jwt
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.hashed_password, password):
        # Generate JWT token (simplified version)
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, 'your-secret-key', algorithm='HS256')
        
        return jsonify({
            'access_token': token,
            'user': user.to_dict()
        })
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/auth/refresh', methods=['POST'])
def refresh_token():
    # Simplified refresh token logic
    return jsonify({'message': 'Token refreshed successfully'})

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    
    # Create new user
    from werkzeug.security import generate_password_hash
    hashed_password = generate_password_hash(password)
    user = User(email=email, hashed_password=hashed_password, role=role)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

