from flask import Flask, request, jsonify, send_from_directory, send_file, make_response
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import jwt
import datetime
from functools import wraps
import os
from bson import ObjectId
import chess
import random
from PIL import Image
import base64
import io
import json
import zipfile
import tempfile

app = Flask(__name__)

# Enhanced CORS configuration
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'f23a3fc8e3bc0e4f4e9b7a2bfae81e293217a884f43c038bce2f1932299b3ff1'
GOOGLE_CLIENT_ID = '612587465923-6svijnd7e3o1hn9jj1tdnlpvksun9j1p.apps.googleusercontent.com'

# File upload configuration
UPLOAD_FOLDER = 'uploads/profile_photos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# MongoDB connection
try:
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    client = MongoClient(MONGODB_URI)
    db = client['chess_app']
    users_collection = db['users']
    profiles_collection = db['profiles']
    games_collection = db['games']
    achievements_collection = db['achievements']
    friends_collection = db['friends']
    friend_requests_collection = db['friend_requests']
    newsletters_collection = db['newsletters']
    newsletter_subscriptions_collection = db['newsletter_subscriptions']
    privacy_settings_collection = db['privacy_settings']
    messages_collection = db['messages']
    chat_rooms_collection = db['chat_rooms']
    print("Connected to MongoDB successfully")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

# Handle preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Optimized Chess AI Engine
class ChessAI:
    def __init__(self, difficulty=3):
        self.difficulty = max(1, min(5, difficulty))
        self.piece_values = {
            chess.PAWN: 100,
            chess.KNIGHT: 320,
            chess.BISHOP: 330,
            chess.ROOK: 500,
            chess.QUEEN: 900,
            chess.KING: 20000,
        }

        # Simplified position tables for faster evaluation
        self.pawn_table = [
            0, 0, 0, 0, 0, 0, 0, 0,
            50, 50, 50, 50, 50, 50, 50, 50,
            10, 10, 20, 30, 30, 20, 10, 10,
            5, 5, 10, 25, 25, 10, 5, 5,
            0, 0, 0, 20, 20, 0, 0, 0,
            5, -5, -10, 0, 0, -10, -5, 5,
            5, 10, 10, -20, -20, 10, 10, 5,
            0, 0, 0, 0, 0, 0, 0, 0
        ]

    def get_position_value(self, piece, square):
        """Simplified position evaluation"""
        if piece.piece_type == chess.PAWN:
            index = square if piece.color == chess.WHITE else 63 - square
            return self.pawn_table[index]
        elif piece.piece_type in [chess.KNIGHT, chess.BISHOP]:
            # Prefer center squares
            file, rank = chess.square_file(square), chess.square_rank(square)
            center_bonus = 10 if 2 <= file <= 5 and 2 <= rank <= 5 else 0
            return center_bonus
        return 0

    def evaluate_position(self, board):
        """Fast position evaluation"""
        if board.is_checkmate():
            return -10000 if board.turn == chess.BLACK else 10000
        
        if board.is_stalemate() or board.is_insufficient_material():
            return 0
        
        score = 0
        
        # Material and basic positional evaluation
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece:
                piece_value = self.piece_values.get(piece.piece_type, 0)
                position_value = self.get_position_value(piece, square)
                total_value = piece_value + position_value
                
                if piece.color == chess.BLACK:
                    score += total_value
                else:
                    score -= total_value
        
        # Mobility bonus (simplified)
        mobility_bonus = len(list(board.legal_moves)) * 5
        score += mobility_bonus if board.turn == chess.BLACK else -mobility_bonus
        
        return score

    def minimax(self, board, depth, alpha, beta, maximizing_player):
        """Optimized minimax with reduced depth for faster play"""
        if depth == 0 or board.is_game_over():
            return self.evaluate_position(board)
        
        moves = list(board.legal_moves)
        
        # Move ordering for better pruning (captures first)
        def move_priority(move):
            if board.is_capture(move):
                return 1000
            return 0
        
        moves.sort(key=move_priority, reverse=True)
        
        if maximizing_player:
            max_eval = float('-inf')
            for move in moves:
                board.push(move)
                eval_score = self.minimax(board, depth - 1, alpha, beta, False)
                board.pop()
                max_eval = max(max_eval, eval_score)
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in moves:
                board.push(move)
                eval_score = self.minimax(board, depth - 1, alpha, beta, True)
                board.pop()
                min_eval = min(min_eval, eval_score)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
            return min_eval

    def get_best_move(self, board):
        """Get the best move with optimized search depth"""
        try:
            moves = list(board.legal_moves)
            if not moves:
                return None
            
            # Reduce search depth for faster play
            search_depth = min(self.difficulty, 3)  # Max depth of 3 for speed
            
            best_move = None
            best_value = float('-inf')
            
            # Add randomness for lower difficulties
            random_factor = (6 - self.difficulty) * 30
            
            # Move ordering for better performance
            def move_priority(move):
                score = 0
                if board.is_capture(move):
                    captured_piece = board.piece_at(move.to_square)
                    if captured_piece:
                        score += self.piece_values.get(captured_piece.piece_type, 0)
                if board.gives_check(move):
                    score += 50
                return score
            
            moves.sort(key=move_priority, reverse=True)
            
            for move in moves:
                board.push(move)
                value = self.minimax(board, search_depth - 1, float('-inf'), float('inf'), False)
                board.pop()
                
                # Add randomness
                if random_factor > 0:
                    value += random.uniform(-random_factor, random_factor)
                
                if value > best_value:
                    best_value = value
                    best_move = move
            
            return best_move
        except Exception as e:
            print(f"Error in get_best_move: {e}")
            moves = list(board.legal_moves)
            return random.choice(moves) if moves else None

# Utility functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_and_crop_image(image_data, size=(200, 200)):
    """Resize and crop image from base64 data"""
    try:
        # Decode base64 image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data)
        
        # Open image with PIL
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Calculate crop box to maintain aspect ratio
        width, height = img.size
        min_dimension = min(width, height)
        
        left = (width - min_dimension) // 2
        top = (height - min_dimension) // 2
        right = left + min_dimension
        bottom = top + min_dimension
        
        # Crop to square
        img = img.crop((left, top, right, bottom))
        
        # Resize to target size
        img = img.resize(size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85, optimize=True)
        img_byte_arr = img_byte_arr.getvalue()
        
        return img_byte_arr
    except Exception as e:
        raise Exception(f"Image processing failed: {str(e)}")

# JWT token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def generate_jwt_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def create_default_profile(user_id):
    """Create default profile for new user"""
    default_profile = {
        'user_id': user_id,
        'bio': '',
        'country': '',
        'location': '',
        'website': '',
        'favoriteOpening': '',
        'profilePhoto': None,
        'stats': {
            'gamesPlayed': 0,
            'wins': 0,
            'losses': 0,
            'draws': 0,
            'rating': 1200,
            'highestRating': 1200,
            'winRate': 0
        },
        'achievements': [],
        'preferences': {
            'theme': 'classic',
            'soundEnabled': True,
            'showCoordinates': True,
            'autoPromoteToQueen': False
        },
        'gameHistory': [],
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    profiles_collection.insert_one(default_profile)
    return default_profile

def check_achievements(user_id, stats, current_achievements):
    """Check and award new achievements"""
    achievements = current_achievements.copy()
    earned_achievement_names = [a['name'] for a in achievements]
    
    possible_achievements = [
        {
            'name': 'First Move',
            'description': 'Play your first game',
            'icon': '🎯',
            'condition': lambda s: s['gamesPlayed'] >= 1
        },
        {
            'name': 'Victory',
            'description': 'Win your first game',
            'icon': '🏆',
            'condition': lambda s: s['wins'] >= 1
        },
        {
            'name': 'Winning Streak',
            'description': 'Win 5 games in a row',
            'icon': '🔥',
            'condition': lambda s: s['wins'] >= 5
        },
        {
            'name': 'Rated Player',
            'description': 'Play 10 rated games',
            'icon': '🎖️',
            'condition': lambda s: s['gamesPlayed'] >= 10
        },
        {
            'name': 'Rising Star',
            'description': 'Reach 1400 rating',
            'icon': '⭐',
            'condition': lambda s: s['rating'] >= 1400
        },
        {
            'name': 'Expert',
            'description': 'Reach 1800 rating',
            'icon': '🎓',
            'condition': lambda s: s['rating'] >= 1800
        },
        {
            'name': 'Chess Master',
            'description': 'Reach 2000 rating',
            'icon': '👑',
            'condition': lambda s: s['rating'] >= 2000
        }
    ]
    
    for achievement in possible_achievements:
        if achievement['name'] not in earned_achievement_names:
            if achievement['condition'](stats):
                achievements.append({
                    'name': achievement['name'],
                    'description': achievement['description'],
                    'icon': achievement['icon'],
                    'earnedAt': datetime.datetime.utcnow()
                })
    
    return achievements

# Authentication Routes
@app.route('/api/signup', methods=['POST'])
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

@app.route('/api/login', methods=['POST'])
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

@app.route('/api/google-auth', methods=['POST'])
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

@app.route('/api/verify-token', methods=['GET'])
@token_required
def verify_token(current_user):
    """Verify if token is valid and return user info"""
    return jsonify({
        'valid': True,
        'user': {
            'id': str(current_user['_id']),
            'name': current_user['name'],
            'email': current_user['email']
        }
    }), 200

# Chess game routes
@app.route('/api/make-move', methods=['POST'])
@token_required
def make_move(current_user):
    """Handle player move"""
    try:
        data = request.get_json()
        move_str = data.get('move')
        fen = data.get('fen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        
        if not move_str:
            return jsonify({'error': 'Move is required'}), 400
        
        # Create board from FEN
        board = chess.Board(fen)
        
        # Check if move captures a piece
        captured_piece = None
        if board.is_capture(chess.Move.from_uci(move_str)):
            target_square = chess.Move.from_uci(move_str).to_square
            if board.is_en_passant(chess.Move.from_uci(move_str)):
                captured_piece = 'p'  # En passant always captures a pawn
            else:
                piece_at_target = board.piece_at(target_square)
                if piece_at_target:
                    captured_piece = piece_at_target.symbol()
        
        # Parse and validate move
        try:
            move = chess.Move.from_uci(move_str)
            if move not in board.legal_moves:
                return jsonify({'error': 'Illegal move'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid move format'}), 400
        
        # Make the move
        board.push(move)
        
        # Check game status
        game_status = "playing"
        result = None
        
        if board.is_checkmate():
            game_status = "ended"
            result = "win" if board.turn == chess.BLACK else "loss"
        elif board.is_stalemate() or board.is_insufficient_material():
            game_status = "ended"
            result = "draw"
        
        return jsonify({
            'fen': board.fen(),
            'isPlayerTurn': False,
            'gameStatus': game_status,
            'result': result,
            'isCheck': board.is_check(),
            'move': move_str,
            'capturedPiece': captured_piece
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to make move: {str(e)}'}), 500

@app.route('/api/ai-move', methods=['POST'])
@token_required
def ai_move(current_user):
    """Get AI move"""
    try:
        data = request.get_json()
        fen = data.get('fen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        difficulty = data.get('difficulty', 3)
        
        # Create board from FEN
        board = chess.Board(fen)
        
        # Initialize AI
        ai = ChessAI(difficulty)
        
        # Get AI move
        ai_move = ai.get_best_move(board)
        
        if not ai_move:
            return jsonify({'error': 'No legal moves available'}), 400
        
        # Check if AI move captures a piece
        captured_piece = None
        if board.is_capture(ai_move):
            target_square = ai_move.to_square
            if board.is_en_passant(ai_move):
                captured_piece = 'P'  # En passant always captures a pawn (uppercase for white)
            else:
                piece_at_target = board.piece_at(target_square)
                if piece_at_target:
                    captured_piece = piece_at_target.symbol()
        
        # Make the AI move
        board.push(ai_move)
        
        # Check game status
        game_status = "playing"
        result = None
        
        if board.is_checkmate():
            game_status = "ended"
            result = "loss" if board.turn == chess.WHITE else "win"
        elif board.is_stalemate() or board.is_insufficient_material():
            game_status = "ended"
            result = "draw"
        
        return jsonify({
            'fen': board.fen(),
            'isPlayerTurn': True,
            'gameStatus': game_status,
            'result': result,
            'isCheck': board.is_check(),
            'aiMove': ai_move.uci(),
            'capturedPiece': captured_piece
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get AI move: {str(e)}'}), 500

# Profile Routes
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile with stats and preferences"""
    try:
        profile = profiles_collection.find_one({'user_id': current_user['_id']})
        if not profile:
            profile = create_default_profile(current_user['_id'])
        
        profile['_id'] = str(profile['_id'])
        profile['user_id'] = str(profile['user_id'])
        
        profile['name'] = current_user['name']
        profile['email'] = current_user['email']
        profile['createdAt'] = current_user.get('created_at')
        
        return jsonify({
            'profile': profile
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500

@app.route('/api/update-profile', methods=['PUT', 'OPTIONS'])
@token_required
def update_profile(current_user):
    """Update user profile information"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Validate and sanitize input
        allowed_fields = ['name', 'bio', 'country', 'location', 'website', 'favoriteOpening', 'preferences']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                if field == 'preferences':
                    update_data[field] = data[field]
                else:
                    update_data[field] = data[field].strip() if isinstance(data[field], str) else data[field]
        
        update_data['updatedAt'] = datetime.datetime.utcnow()
        
        # Update profile
        result = profiles_collection.update_one(
            {'user_id': current_user['_id']},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            # Create profile if it doesn't exist
            create_default_profile(current_user['_id'])
            profiles_collection.update_one(
                {'user_id': current_user['_id']},
                {'$set': update_data}
            )
        
        # Also update user name if provided
        if 'name' in update_data:
            users_collection.update_one(
                {'_id': current_user['_id']},
                {'$set': {'name': update_data['name'], 'updated_at': datetime.datetime.utcnow()}}
            )
        
        # Get updated profile
        updated_profile = profiles_collection.find_one({'user_id': current_user['_id']})
        updated_profile['_id'] = str(updated_profile['_id'])
        updated_profile['user_id'] = str(updated_profile['user_id'])
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': updated_profile
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@app.route('/api/update-game-stats', methods=['POST'])
@token_required
def update_game_stats(current_user):
    """Update game statistics after a game"""
    try:
        data = request.get_json()
        result = data.get('result')
        opponent_rating = data.get('opponent_rating', 1200)
        game_type = data.get('game_type', 'casual')
        
        profile = profiles_collection.find_one({'user_id': current_user['_id']})
        if not profile:
            profile = create_default_profile(current_user['_id'])
        
        new_stats = profile.get('stats', {
            'gamesPlayed': 0, 'wins': 0, 'losses': 0, 'draws': 0,
            'rating': 1200, 'highestRating': 1200, 'winRate': 0
        })
        
        new_stats['gamesPlayed'] += 1
        
        if result == 'win':
            new_stats['wins'] += 1
        elif result == 'loss':
            new_stats['losses'] += 1
        elif result == 'draw':
            new_stats['draws'] += 1
        
        if game_type == 'ranked':
            current_rating = new_stats['rating']
            expected_score = 1 / (1 + 10**((opponent_rating - current_rating) / 400))
            
            if result == 'win':
                actual_score = 1
            elif result == 'loss':
                actual_score = 0
            else:
                actual_score = 0.5
            
            k_factor = 32 if new_stats['gamesPlayed'] < 30 else 16
            rating_change = k_factor * (actual_score - expected_score)
            new_stats['rating'] = max(100, int(current_rating + rating_change))
            
            if new_stats['rating'] > new_stats['highestRating']:
                new_stats['highestRating'] = new_stats['rating']
        
        if new_stats['gamesPlayed'] > 0:
            new_stats['winRate'] = round((new_stats['wins'] / new_stats['gamesPlayed']) * 100, 1)
        
        achievements = check_achievements(current_user['_id'], new_stats, profile.get('achievements', []))
        
        game_record = {
            'user_id': current_user['_id'],
            'result': result,
            'opponent_rating': opponent_rating,
            'game_type': game_type,
            'rating_before': profile.get('stats', {}).get('rating', 1200),
            'rating_after': new_stats['rating'],
            'played_at': datetime.datetime.utcnow()
        }
        games_collection.insert_one(game_record)
        
        profiles_collection.update_one(
            {'user_id': current_user['_id']},
            {
                '$set': {
                    'stats': new_stats,
                    'achievements': achievements,
                    'updatedAt': datetime.datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            'message': 'Game stats updated successfully',
            'stats': new_stats,
            'achievements': achievements
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update game stats: {str(e)}'}), 500

@app.route('/api/game-history', methods=['GET'])
@token_required
def get_game_history(current_user):
    """Get user's game history"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        games = list(games_collection.find(
            {'user_id': current_user['_id']}
        ).sort('played_at', -1).skip(skip).limit(limit))
        
        for game in games:
            game['_id'] = str(game['_id'])
            game['user_id'] = str(game['user_id'])
        
        total_games = games_collection.count_documents({'user_id': current_user['_id']})
        
        return jsonify({
            'games': games,
            'total': total_games,
            'page': page,
            'pages': (total_games + limit - 1) // limit
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch game history: {str(e)}'}), 500

# Profile Photo Upload with Base64 Storage
@app.route('/api/upload-profile-photo', methods=['POST', 'OPTIONS'])
@token_required
def upload_profile_photo(current_user):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        if not data or 'imageData' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        image_data = data['imageData']
        
        # Process and resize image
        processed_image_bytes = resize_and_crop_image(image_data)
        
        # Convert to base64 string
        base64_image = base64.b64encode(processed_image_bytes).decode('utf-8')
        profile_photo_data = f"data:image/jpeg;base64,{base64_image}"
        
        # Update user profile with base64 image
        profiles_collection.update_one(
            {'user_id': current_user['_id']},
            {
                '$set': {
                    'profilePhoto': profile_photo_data,
                    'updatedAt': datetime.datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            'message': 'Profile photo uploaded successfully',
            'profilePhoto': profile_photo_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to upload photo: {str(e)}'}), 500

@app.route('/api/export-game-data', methods=['GET', 'OPTIONS'])
@token_required
def export_game_data(current_user):
    """Export user's game data as JSON"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user profile
        profile = profiles_collection.find_one({'user_id': current_user['_id']})
        
        # Get user's games
        games = list(games_collection.find({'user_id': current_user['_id']}))
        
        # Get achievements
        achievements = profile.get('achievements', []) if profile else []
        
        # Prepare export data
        export_data = {
            'user_info': {
                'name': current_user['name'],
                'email': current_user['email'],
                'export_date': datetime.datetime.utcnow().isoformat()
            },
            'profile': {
                'bio': profile.get('bio', '') if profile else '',
                'country': profile.get('country', '') if profile else '',
                'location': profile.get('location', '') if profile else '',
                'favoriteOpening': profile.get('favoriteOpening', '') if profile else '',
                'stats': profile.get('stats', {}) if profile else {},
                'preferences': profile.get('preferences', {}) if profile else {}
            },
            'games': [],
            'achievements': achievements
        }
        
        # Process games
        for game in games:
            game_data = {
                'id': str(game['_id']),
                'result': game.get('result', ''),
                'opponent_rating': game.get('opponent_rating', 0),
                'game_type': game.get('game_type', ''),
                'rating_before': game.get('rating_before', 0),
                'rating_after': game.get('rating_after', 0),
                'date': game.get('played_at').isoformat() if game.get('played_at') else ''
            }
            export_data['games'].append(game_data)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            json.dump(export_data, temp_file, indent=2, default=str)
            temp_filename = temp_file.name
        
        return send_file(
            temp_filename,
            as_attachment=True,
            download_name=f'chess_data_{current_user["name"]}_{datetime.datetime.utcnow().strftime("%Y%m%d")}.json',
            mimetype='application/json'
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to export data: {str(e)}'}), 500

# Chat System Routes
@app.route('/api/chat/rooms', methods=['GET'])
@token_required
def get_chat_rooms(current_user):
    """Get user's chat rooms"""
    try:
        # Get rooms where user is a participant
        rooms = list(chat_rooms_collection.find({
            'participants': current_user['_id']
        }).sort('last_message_at', -1))
        
        chat_rooms = []
        for room in rooms:
            # Get other participant info
            other_participant_id = None
            for participant_id in room['participants']:
                if participant_id != current_user['_id']:
                    other_participant_id = participant_id
                    break
            
            if other_participant_id:
                other_user = users_collection.find_one({'_id': other_participant_id})
                other_profile = profiles_collection.find_one({'user_id': other_participant_id})
                
                # Get last message
                last_message = messages_collection.find_one(
                    {'room_id': room['_id']},
                    sort=[('created_at', -1)]
                )
                
                # Count unread messages
                unread_count = messages_collection.count_documents({
                    'room_id': room['_id'],
                    'sender_id': {'$ne': current_user['_id']},
                    'read': False
                })
                
                chat_rooms.append({
                    'id': str(room['_id']),
                    'participant': {
                        'id': str(other_user['_id']),
                        'name': other_user['name'],
                        'profilePhoto': other_profile.get('profilePhoto') if other_profile else None,
                        'status': 'online'  # Implement real-time status
                    },
                    'lastMessage': {
                        'content': last_message.get('content', '') if last_message else '',
                        'timestamp': last_message.get('created_at') if last_message else room.get('created_at'),
                        'senderId': str(last_message.get('sender_id')) if last_message else None
                    },
                    'unreadCount': unread_count,
                    'createdAt': room.get('created_at')
                })
        
        return jsonify({'rooms': chat_rooms}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch chat rooms: {str(e)}'}), 500

@app.route('/api/chat/room/<friend_id>', methods=['POST'])
@token_required
def create_or_get_chat_room(current_user, friend_id):
    """Create or get existing chat room with friend"""
    try:
        friend_obj_id = ObjectId(friend_id)
        
        # Check if room already exists
        existing_room = chat_rooms_collection.find_one({
            'participants': {'$all': [current_user['_id'], friend_obj_id]},
            'type': 'direct'
        })
        
        if existing_room:
            return jsonify({
                'roomId': str(existing_room['_id']),
                'exists': True
            }), 200
        
        # Create new room
        room_data = {
            'participants': [current_user['_id'], friend_obj_id],
            'type': 'direct',
            'created_at': datetime.datetime.utcnow(),
            'last_message_at': datetime.datetime.utcnow()
        }
        
        result = chat_rooms_collection.insert_one(room_data)
        
        return jsonify({
            'roomId': str(result.inserted_id),
            'exists': False
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create chat room: {str(e)}'}), 500

@app.route('/api/chat/messages/<room_id>', methods=['GET'])
@token_required
def get_chat_messages(current_user, room_id):
    """Get messages for a chat room"""
    try:
        room_obj_id = ObjectId(room_id)
        
        # Verify user is participant
        room = chat_rooms_collection.find_one({
            '_id': room_obj_id,
            'participants': current_user['_id']
        })
        
        if not room:
            return jsonify({'error': 'Chat room not found'}), 404
        
        # Get messages with pagination
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        messages = list(messages_collection.find({
            'room_id': room_obj_id
        }).sort('created_at', -1).skip(skip).limit(limit))
        
        # Reverse to show oldest first
        messages.reverse()
        
        message_list = []
        for message in messages:
            sender = users_collection.find_one({'_id': message['sender_id']})
            sender_profile = profiles_collection.find_one({'user_id': message['sender_id']})
            
            message_list.append({
                'id': str(message['_id']),
                'content': message['content'],
                'senderId': str(message['sender_id']),
                'senderName': sender['name'] if sender else 'Unknown',
                'senderPhoto': sender_profile.get('profilePhoto') if sender_profile else None,
                'timestamp': message['created_at'],
                'read': message.get('read', False),
                'type': message.get('type', 'text')
            })
        
        # Mark messages as read
        messages_collection.update_many(
            {
                'room_id': room_obj_id,
                'sender_id': {'$ne': current_user['_id']},
                'read': False
            },
            {'$set': {'read': True, 'read_at': datetime.datetime.utcnow()}}
        )
        
        return jsonify({
            'messages': message_list,
            'hasMore': len(messages) == limit
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch messages: {str(e)}'}), 500

@app.route('/api/chat/send', methods=['POST'])
@token_required
def send_message(current_user):
    """Send a message"""
    try:
        data = request.get_json()
        room_id = ObjectId(data.get('roomId'))
        content = data.get('content', '').strip()
        message_type = data.get('type', 'text')
        
        if not content:
            return jsonify({'error': 'Message content is required'}), 400
        
        # Verify user is participant
        room = chat_rooms_collection.find_one({
            '_id': room_id,
            'participants': current_user['_id']
        })
        
        if not room:
            return jsonify({'error': 'Chat room not found'}), 404
        
        # Create message
        message_data = {
            'room_id': room_id,
            'sender_id': current_user['_id'],
            'content': content,
            'type': message_type,
            'read': False,
            'created_at': datetime.datetime.utcnow()
        }
        
        result = messages_collection.insert_one(message_data)
        
        # Update room's last message time
        chat_rooms_collection.update_one(
            {'_id': room_id},
            {'$set': {'last_message_at': datetime.datetime.utcnow()}}
        )
        
        # Get sender profile for response
        sender_profile = profiles_collection.find_one({'user_id': current_user['_id']})
        
        message_response = {
            'id': str(result.inserted_id),
            'content': content,
            'senderId': str(current_user['_id']),
            'senderName': current_user['name'],
            'senderPhoto': sender_profile.get('profilePhoto') if sender_profile else None,
            'timestamp': message_data['created_at'],
            'read': False,
            'type': message_type
        }
        
        return jsonify({
            'message': 'Message sent successfully',
            'messageData': message_response
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to send message: {str(e)}'}), 500

# Friends System Routes
@app.route('/api/friends', methods=['GET'])
@token_required
def get_friends(current_user):
    """Get user's friends list"""
    try:
        # Get all accepted friendships where user is involved
        friendships = list(friends_collection.find({
            '$or': [
                {'user1_id': current_user['_id']},
                {'user2_id': current_user['_id']}
            ],
            'status': 'accepted'
        }))
        
        friends = []
        for friendship in friendships:
            # Get the other user's ID
            friend_id = friendship['user2_id'] if friendship['user1_id'] == current_user['_id'] else friendship['user1_id']
            
            # Get friend's details
            friend = users_collection.find_one({'_id': friend_id})
            friend_profile = profiles_collection.find_one({'user_id': friend_id})
            
            if friend and friend_profile:
                friends.append({
                    'id': str(friend['_id']),
                    'name': friend['name'],
                    'email': friend['email'],
                    'profilePhoto': friend_profile.get('profilePhoto'),
                    'rating': friend_profile.get('stats', {}).get('rating', 1200),
                    'status': 'online',  # You can implement real-time status later
                    'lastSeen': friendship.get('created_at'),
                    'friendshipDate': friendship.get('created_at')
                })
        
        return jsonify({'friends': friends}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch friends: {str(e)}'}), 500

@app.route('/api/friend-requests/incoming', methods=['GET'])
@token_required
def get_incoming_friend_requests(current_user):
    """Get pending friend requests sent to current user"""
    try:
        requests = list(friend_requests_collection.find({
            'recipient_id': current_user['_id'],
            'status': 'pending'
        }).sort('created_at', -1))
        
        incoming_requests = []
        for request in requests:
            requester = users_collection.find_one({'_id': request['requester_id']})
            requester_profile = profiles_collection.find_one({'user_id': request['requester_id']})
            
            if requester and requester_profile:
                incoming_requests.append({
                    'requestId': str(request['_id']),
                    'id': str(requester['_id']),
                    'name': requester['name'],
                    'email': requester['email'],
                    'profilePhoto': requester_profile.get('profilePhoto'),
                    'rating': requester_profile.get('stats', {}).get('rating', 1200),
                    'requestDate': request.get('created_at'),
                    'message': request.get('message', '')
                })
        
        return jsonify({'requests': incoming_requests}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch incoming requests: {str(e)}'}), 500

@app.route('/api/friend-requests/outgoing', methods=['GET'])
@token_required
def get_outgoing_friend_requests(current_user):
    """Get pending friend requests sent by current user"""
    try:
        requests = list(friend_requests_collection.find({
            'requester_id': current_user['_id'],
            'status': 'pending'
        }).sort('created_at', -1))
        
        outgoing_requests = []
        for request in requests:
            recipient = users_collection.find_one({'_id': request['recipient_id']})
            recipient_profile = profiles_collection.find_one({'user_id': request['recipient_id']})
            
            if recipient and recipient_profile:
                outgoing_requests.append({
                    'requestId': str(request['_id']),
                    'id': str(recipient['_id']),
                    'name': recipient['name'],
                    'email': recipient['email'],
                    'profilePhoto': recipient_profile.get('profilePhoto'),
                    'rating': recipient_profile.get('stats', {}).get('rating', 1200),
                    'requestDate': request.get('created_at'),
                    'message': request.get('message', '')
                })
        
        return jsonify({'requests': outgoing_requests}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch outgoing requests: {str(e)}'}), 500

@app.route('/api/friend-suggestions', methods=['GET'])
@token_required
def get_friend_suggestions(current_user):
    """Get friend suggestions for current user"""
    try:
        # Get current friends
        current_friends = list(friends_collection.find({
            '$or': [
                {'user1_id': current_user['_id']},
                {'user2_id': current_user['_id']}
            ]
        }))
        
        friend_ids = set()
        for friendship in current_friends:
            friend_ids.add(friendship['user1_id'])
            friend_ids.add(friendship['user2_id'])
        friend_ids.add(current_user['_id'])  # Exclude self
        
        # Get pending requests (both sent and received)
        pending_requests = list(friend_requests_collection.find({
            '$or': [
                {'requester_id': current_user['_id']},
                {'recipient_id': current_user['_id']}
            ],
            'status': 'pending'
        }))
        
        for request in pending_requests:
            friend_ids.add(request['requester_id'])
            friend_ids.add(request['recipient_id'])
        
        # Find users not in friends list or pending requests
        suggestions = list(users_collection.find({
            '_id': {'$nin': list(friend_ids)}
        }).limit(10))
        
        suggestion_list = []
        for user in suggestions:
            user_profile = profiles_collection.find_one({'user_id': user['_id']})
            if user_profile:
                # Calculate mutual friends
                user_friends = list(friends_collection.find({
                    '$or': [
                        {'user1_id': user['_id']},
                        {'user2_id': user['_id']}
                    ],
                    'status': 'accepted'
                }))
                
                mutual_count = 0
                for user_friendship in user_friends:
                    other_user_id = user_friendship['user2_id'] if user_friendship['user1_id'] == user['_id'] else user_friendship['user1_id']
                    
                    # Check if this other_user_id is in current user's friends
                    is_mutual = friends_collection.find_one({
                        '$or': [
                            {'user1_id': current_user['_id'], 'user2_id': other_user_id},
                            {'user1_id': other_user_id, 'user2_id': current_user['_id']}
                        ],
                        'status': 'accepted'
                    })
                    
                    if is_mutual:
                        mutual_count += 1
                
                suggestion_list.append({
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'profilePhoto': user_profile.get('profilePhoto'),
                    'rating': user_profile.get('stats', {}).get('rating', 1200),
                    'mutualFriends': mutual_count,
                    'country': user_profile.get('country', ''),
                    'joinedDate': user.get('created_at')
                })
        
        # Sort by mutual friends count (descending)
        suggestion_list.sort(key=lambda x: x['mutualFriends'], reverse=True)
        
        return jsonify({'suggestions': suggestion_list}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch suggestions: {str(e)}'}), 500

@app.route('/api/send-friend-request', methods=['POST'])
@token_required
def send_friend_request(current_user):
    """Send friend request to another user"""
    try:
        data = request.get_json()
        recipient_id = ObjectId(data.get('userId'))
        message = data.get('message', '').strip()
        
        # Check if recipient exists
        recipient = users_collection.find_one({'_id': recipient_id})
        if not recipient:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if trying to send request to self
        if recipient_id == current_user['_id']:
            return jsonify({'error': 'Cannot send friend request to yourself'}), 400
        
        # Check if already friends
        existing_friendship = friends_collection.find_one({
            '$or': [
                {'user1_id': current_user['_id'], 'user2_id': recipient_id},
                {'user1_id': recipient_id, 'user2_id': current_user['_id']}
            ]
        })
        
        if existing_friendship:
            return jsonify({'error': 'Already friends with this user'}), 400
        
        # Check if request already exists (either direction)
        existing_request = friend_requests_collection.find_one({
            '$or': [
                {'requester_id': current_user['_id'], 'recipient_id': recipient_id},
                {'requester_id': recipient_id, 'recipient_id': current_user['_id']}
            ],
            'status': 'pending'
        })
        
        if existing_request:
            if existing_request['requester_id'] == current_user['_id']:
                return jsonify({'error': 'Friend request already sent'}), 400
            else:
                return jsonify({'error': 'This user has already sent you a friend request'}), 400
        
        # Create friend request
        request_data = {
            'requester_id': current_user['_id'],
            'recipient_id': recipient_id,
            'message': message,
            'status': 'pending',
            'created_at': datetime.datetime.utcnow()
        }
        
        result = friend_requests_collection.insert_one(request_data)
        
        return jsonify({
            'message': 'Friend request sent successfully',
            'requestId': str(result.inserted_id),
            'recipient': {
                'id': str(recipient_id),
                'name': recipient['name']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to send friend request: {str(e)}'}), 500

@app.route('/api/accept-friend-request', methods=['POST'])
@token_required
def accept_friend_request(current_user):
    """Accept a friend request"""
    try:
        data = request.get_json()
        request_id = ObjectId(data.get('requestId'))
        
        # Find the friend request
        friend_request = friend_requests_collection.find_one({
            '_id': request_id,
            'recipient_id': current_user['_id'],
            'status': 'pending'
        })
        
        if not friend_request:
            return jsonify({'error': 'Friend request not found'}), 404
        
        # Create friendship (bidirectional relationship)
        friendship_data = {
            'user1_id': friend_request['requester_id'],
            'user2_id': current_user['_id'],
            'status': 'accepted',
            'created_at': datetime.datetime.utcnow()
        }
        
        friends_collection.insert_one(friendship_data)
        
        # Update request status
        friend_requests_collection.update_one(
            {'_id': request_id},
            {
                '$set': {
                    'status': 'accepted',
                    'accepted_at': datetime.datetime.utcnow()
                }
            }
        )
        
        # Get requester info for response
        requester = users_collection.find_one({'_id': friend_request['requester_id']})
        
        return jsonify({
            'message': 'Friend request accepted',
            'friend': {
                'id': str(friend_request['requester_id']),
                'name': requester['name'] if requester else 'Unknown'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to accept friend request: {str(e)}'}), 500

@app.route('/api/decline-friend-request', methods=['POST'])
@token_required
def decline_friend_request(current_user):
    """Decline a friend request"""
    try:
        data = request.get_json()
        request_id = ObjectId(data.get('requestId'))
        
        # Find the friend request
        friend_request = friend_requests_collection.find_one({
            '_id': request_id,
            'recipient_id': current_user['_id'],
            'status': 'pending'
        })
        
        if not friend_request:
            return jsonify({'error': 'Friend request not found'}), 404
        
        # Update request status to declined
        friend_requests_collection.update_one(
            {'_id': request_id},
            {
                '$set': {
                    'status': 'declined',
                    'declined_at': datetime.datetime.utcnow()
                }
            }
        )
        
        return jsonify({'message': 'Friend request declined'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to decline friend request: {str(e)}'}), 500

@app.route('/api/cancel-friend-request', methods=['POST'])
@token_required
def cancel_friend_request(current_user):
    """Cancel a sent friend request"""
    try:
        data = request.get_json()
        request_id = ObjectId(data.get('requestId'))
        
        # Find the friend request
        friend_request = friend_requests_collection.find_one({
            '_id': request_id,
            'requester_id': current_user['_id'],
            'status': 'pending'
        })
        
        if not friend_request:
            return jsonify({'error': 'Friend request not found'}), 404
        
        # Delete the request
        friend_requests_collection.delete_one({'_id': request_id})
        
        return jsonify({'message': 'Friend request cancelled'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to cancel friend request: {str(e)}'}), 500

@app.route('/api/remove-friend', methods=['POST'])
@token_required
def remove_friend(current_user):
    """Remove a friend"""
    try:
        data = request.get_json()
        friend_id = ObjectId(data.get('friendId'))
        
        # Remove friendship
        result = friends_collection.delete_one({
            '$or': [
                {'user1_id': current_user['_id'], 'user2_id': friend_id},
                {'user1_id': friend_id, 'user2_id': current_user['_id']}
            ]
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Friendship not found'}), 404
        
        # Update the friend request status to 'unfriended' if it exists
        friend_requests_collection.update_one(
            {
                '$or': [
                    {'requester_id': current_user['_id'], 'recipient_id': friend_id},
                    {'requester_id': friend_id, 'recipient_id': current_user['_id']}
                ]
            },
            {
                '$set': {
                    'status': 'unfriended',
                    'unfriended_at': datetime.datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            'message': 'Friend removed successfully',
            'friendId': str(friend_id)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to remove friend: {str(e)}'}), 500

@app.route('/api/search-users', methods=['GET'])
@token_required
def search_users(current_user):
    """Search for users to add as friends"""
    try:
        query = request.args.get('q', '').strip()
        if len(query) < 2:
            return jsonify({'users': []}), 200
        
        # Search users by name or email
        users = list(users_collection.find({
            '$and': [
                {'_id': {'$ne': current_user['_id']}},  # Exclude current user
                {
                    '$or': [
                        {'name': {'$regex': query, '$options': 'i'}},
                        {'email': {'$regex': query, '$options': 'i'}}
                    ]
                }
            ]
        }).limit(20))
        
        # Get current user's friends and pending requests
        friends = list(friends_collection.find({
            '$or': [
                {'user1_id': current_user['_id']},
                {'user2_id': current_user['_id']}
            ]
        }))
        
        friend_ids = set()
        for friendship in friends:
            friend_ids.add(friendship['user1_id'])
            friend_ids.add(friendship['user2_id'])
        
        pending_requests = list(friend_requests_collection.find({
            '$or': [
                {'requester_id': current_user['_id']},
                {'recipient_id': current_user['_id']}
            ],
            'status': 'pending'
        }))
        
        request_user_ids = set()
        for request in pending_requests:
            request_user_ids.add(request['requester_id'])
            request_user_ids.add(request['recipient_id'])
        
        search_results = []
        for user in users:
            user_profile = profiles_collection.find_one({'user_id': user['_id']})
            
            # Determine relationship status
            relationship_status = 'none'
            if user['_id'] in friend_ids:
                relationship_status = 'friends'
            elif user['_id'] in request_user_ids:
                # Check if current user sent the request
                sent_request = friend_requests_collection.find_one({
                    'requester_id': current_user['_id'],
                    'recipient_id': user['_id'],
                    'status': 'pending'
                })
                if sent_request:
                    relationship_status = 'request_sent'
                else:
                    relationship_status = 'request_received'
            
            search_results.append({
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'profilePhoto': user_profile.get('profilePhoto') if user_profile else None,
                'rating': user_profile.get('stats', {}).get('rating', 1200) if user_profile else 1200,
                'country': user_profile.get('country', '') if user_profile else '',
                'relationshipStatus': relationship_status,
                'joinedDate': user.get('created_at')
            })
        
        return jsonify({'users': search_results}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to search users: {str(e)}'}), 500

# Newsletter Routes
@app.route('/api/newsletters', methods=['GET'])
@token_required
def get_newsletters(current_user):
    """Get available newsletters"""
    try:
        # Get user's subscriptions
        subscriptions = list(newsletter_subscriptions_collection.find({
            'user_id': current_user['_id']
        }))
        
        subscribed_newsletter_ids = [sub['newsletter_id'] for sub in subscriptions]
        
        # Mock newsletter data (you can replace with actual database)
        newsletters = [
            {
                'id': 1,
                'name': 'Chess Daily',
                'description': 'Daily chess puzzles, tips, and news from the chess world',
                'subscribers': '125K',
                'frequency': 'Daily',
                'category': 'General',
                'subscribed': 1 in subscribed_newsletter_ids
            },
            {
                'id': 2,
                'name': 'Opening Mastery',
                'description': 'Deep dive into chess openings with grandmaster analysis',
                'subscribers': '89K',
                'frequency': 'Weekly',
                'category': 'Education',
                'subscribed': 2 in subscribed_newsletter_ids
            },
            {
                'id': 3,
                'name': 'Tournament Updates',
                'description': 'Latest news from major chess tournaments worldwide',
                'subscribers': '156K',
                'frequency': 'Bi-weekly',
                'category': 'News',
                'subscribed': 3 in subscribed_newsletter_ids
            },
            {
                'id': 4,
                'name': 'Endgame Excellence',
                'description': 'Master endgame techniques with expert guidance',
                'subscribers': '67K',
                'frequency': 'Weekly',
                'category': 'Education',
                'subscribed': 4 in subscribed_newsletter_ids
            }
        ]
        
        return jsonify({'newsletters': newsletters}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch newsletters: {str(e)}'}), 500

@app.route('/api/subscribe-newsletter', methods=['POST'])
@token_required
def subscribe_newsletter(current_user):
    """Subscribe/unsubscribe to newsletter"""
    try:
        data = request.get_json()
        newsletter_id = data.get('newsletterId')
        
        # Check if already subscribed
        existing_subscription = newsletter_subscriptions_collection.find_one({
            'user_id': current_user['_id'],
            'newsletter_id': newsletter_id
        })
        
        if existing_subscription:
            # Unsubscribe
            newsletter_subscriptions_collection.delete_one({
                'user_id': current_user['_id'],
                'newsletter_id': newsletter_id
            })
            subscribed = False
            message = 'Unsubscribed successfully'
        else:
            # Subscribe
            newsletter_subscriptions_collection.insert_one({
                'user_id': current_user['_id'],
                'newsletter_id': newsletter_id,
                'subscribed_at': datetime.datetime.utcnow()
            })
            subscribed = True
            message = 'Subscribed successfully'
        
        return jsonify({
            'message': message,
            'newsletterId': newsletter_id,
            'subscribed': subscribed
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update subscription: {str(e)}'}), 500

# Additional Settings Routes
@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password"""
    try:
        if current_user.get('auth_provider') == 'google':
            return jsonify({'error': 'Cannot change password for Google authenticated users'}), 400
        
        data = request.get_json()
        current_password = data.get('currentPassword', '')
        new_password = data.get('newPassword', '')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
        
        if not check_password_hash(current_user.get('password', ''), current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        hashed_password = generate_password_hash(new_password)
        users_collection.update_one(
            {'_id': current_user['_id']},
            {
                '$set': {
                    'password': hashed_password,
                    'updated_at': datetime.datetime.utcnow()
                }
            }
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Password change failed: {str(e)}'}), 500

@app.route('/api/delete-account', methods=['DELETE'])
@token_required
def delete_account(current_user):
    """Delete user account and all associated data"""
    try:
        data = request.get_json()
        confirmation = data.get('confirmation', '').lower()
        password = data.get('password', '')
        
        if confirmation != 'delete my account':
            return jsonify({'error': 'Invalid confirmation text'}), 400
        
        # Verify password for email accounts
        if current_user.get('auth_provider') == 'email':
            if not password:
                return jsonify({'error': 'Password is required'}), 400
            
            if not check_password_hash(current_user.get('password', ''), password):
                return jsonify({'error': 'Incorrect password'}), 400
        
        user_id = current_user['_id']
        
        # Delete all user-related data
        profiles_collection.delete_one({'user_id': user_id})
        friends_collection.delete_many({
            '$or': [
                {'user1_id': user_id},
                {'user2_id': user_id}
            ]
        })
        friend_requests_collection.delete_many({
            '$or': [
                {'requester_id': user_id},
                {'recipient_id': user_id}
            ]
        })
        newsletter_subscriptions_collection.delete_many({'user_id': user_id})
        games_collection.delete_many({'user_id': user_id})
        achievements_collection.delete_many({'user_id': user_id})
        messages_collection.delete_many({'sender_id': user_id})
        
        # Remove user from chat rooms
        chat_rooms_collection.delete_many({'participants': user_id})
        
        # Finally delete the user account
        users_collection.delete_one({'_id': user_id})
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete account: {str(e)}'}), 500

# Privacy Settings Routes
@app.route('/api/privacy-settings', methods=['GET'])
@token_required
def get_privacy_settings(current_user):
    """Get user's privacy settings"""
    try:
        settings = privacy_settings_collection.find_one({'user_id': current_user['_id']})
        
        if not settings:
            # Create default privacy settings
            default_settings = {
                'user_id': current_user['_id'],
                'profile_visibility': 'public',  # public, friends, private
                'show_online_status': True,
                'allow_friend_requests': True,
                'show_game_history': 'friends',  # public, friends, private
                'show_rating': True,
                'allow_messages': 'friends',  # everyone, friends, none
                'email_notifications': True,
                'created_at': datetime.datetime.utcnow(),
                'updated_at': datetime.datetime.utcnow()
            }
            privacy_settings_collection.insert_one(default_settings)
            settings = default_settings
        
        settings['_id'] = str(settings['_id'])
        settings['user_id'] = str(settings['user_id'])
        
        return jsonify({'settings': settings}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch privacy settings: {str(e)}'}), 500

@app.route('/api/privacy-settings', methods=['PUT'])
@token_required
def update_privacy_settings(current_user):
    """Update user's privacy settings"""
    try:
        data = request.get_json()
        
        allowed_fields = [
            'profile_visibility', 'show_online_status', 'allow_friend_requests',
            'show_game_history', 'show_rating', 'allow_messages', 'email_notifications'
        ]
        
        update_data = {}
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_data['updated_at'] = datetime.datetime.utcnow()
        
        result = privacy_settings_collection.update_one(
            {'user_id': current_user['_id']},
            {'$set': update_data},
            upsert=True
        )
        
        return jsonify({
            'message': 'Privacy settings updated successfully',
            'settings': update_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update privacy settings: {str(e)}'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'error': 'File too large. Maximum size is 5MB'}), 413

# Main application runner
if __name__ == '__main__':
    try:
        # Create database indexes for better performance
        users_collection.create_index('email', unique=True)
        users_collection.create_index('google_id')
        profiles_collection.create_index('user_id', unique=True)
        games_collection.create_index([('user_id', 1), ('played_at', -1)])
        friends_collection.create_index([('user1_id', 1), ('user2_id', 1)], unique=True)
        friend_requests_collection.create_index([('requester_id', 1), ('recipient_id', 1)])
        messages_collection.create_index([('room_id', 1), ('created_at', -1)])
        chat_rooms_collection.create_index('participants')
        newsletter_subscriptions_collection.create_index([('user_id', 1), ('newsletter_id', 1)], unique=True)
        privacy_settings_collection.create_index('user_id', unique=True)
        
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Error creating indexes: {e}")
    
    print("Starting Chess App API Server...")
    print("Available endpoints:")
    print("- Authentication: /api/signup, /api/login, /api/google-auth")
    print("- Profile: /api/profile, /api/update-profile, /api/upload-profile-photo")
    print("- Chess: /api/make-move, /api/ai-move")
    print("- Friends: /api/friends, /api/friend-requests/*")
    print("- Chat: /api/chat/*")
    print("- Settings: /api/change-password, /api/delete-account, /api/privacy-settings")
    print("- Data: /api/export-game-data, /api/game-history")
    
    app.run(debug=True, host='0.0.0.0', port=5000)

