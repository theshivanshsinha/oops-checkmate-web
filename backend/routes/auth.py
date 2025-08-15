from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import datetime
from bson import ObjectId

from database import users_collection
from utils import generate_jwt_token
from models import create_default_profile
from config import GOOGLE_CLIENT_ID

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        existing_user = users_collection.find_one({'email': email})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        hashed_password = generate_password_hash(password)
        user_data = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'auth_provider': 'email',
            'created_at': datetime.datetime.utcnow(),
            'updated_at': datetime.datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_data)
        user_id = result.inserted_id
        
        create_default_profile(user_id)
        token = generate_jwt_token(user_id)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': str(user_id),
                'name': name,
                'email': email
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if user.get('auth_provider') == 'google' and 'password' not in user:
            return jsonify({'error': 'This account was created with Google. Please use Google login.'}), 401
        
        if not check_password_hash(user.get('password', ''), password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        token = generate_jwt_token(user['_id'])
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/google-auth', methods=['POST'])
def google_auth():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        
        idinfo = id_token.verify_oauth2_token(token, grequests.Request(), GOOGLE_CLIENT_ID)
        
        user_email = idinfo['email'].lower()
        user_name = idinfo.get('name', '')
        google_id = idinfo.get('sub')
        
        existing_user = users_collection.find_one({'email': user_email})
        
        if existing_user:
            users_collection.update_one(
                {'_id': existing_user['_id']},
                {'$set': {'updated_at': datetime.datetime.utcnow()}}
            )
            user_id = existing_user['_id']
            name = existing_user['name']
        else:
            user_data = {
                'name': user_name,
                'email': user_email,
                'google_id': google_id,
                'auth_provider': 'google',
                'created_at': datetime.datetime.utcnow(),
                'updated_at': datetime.datetime.utcnow()
            }
            result = users_collection.insert_one(user_data)
            user_id = result.inserted_id
            name = user_name
            
            create_default_profile(user_id)
        
        jwt_token = generate_jwt_token(user_id)
        
        return jsonify({
            'message': 'Google authentication successful',
            'token': jwt_token,
            'user': {
                'id': str(user_id),
                'name': name,
                'email': user_email
            }
        }), 200
        
    except ValueError as e:
        return jsonify({'error': 'Invalid Google token'}), 400
    except Exception as e:
        return jsonify({'error': f'Google authentication failed: {str(e)}'}), 500

@auth_bp.route('/verify-token', methods=['GET'])
def verify_token():
    """Verify if token is valid and return user info"""
    from utils import token_required
    
    @token_required
    def verify(current_user):
        return jsonify({
            'valid': True,
            'user': {
                'id': str(current_user['_id']),
                'name': current_user['name'],
                'email': current_user['email']
            }
        }), 200
    
    return verify()
