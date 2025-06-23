from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import jwt
import datetime
from functools import wraps
import os
from bson import ObjectId
import chess
import random

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'f23a3fc8e3bc0e4f4e9b7a2bfae81e293217a884f43c038bce2f1932299b3ff1'
GOOGLE_CLIENT_ID = '612587465923-6svijnd7e3o1hn9jj1tdnlpvksun9j1p.apps.googleusercontent.com'

# MongoDB connection
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['chess_app']
    users_collection = db['users']
    profiles_collection = db['profiles']
    games_collection = db['games']
    achievements_collection = db['achievements']
    print("Connected to MongoDB successfully")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

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

# JWT token decorator (keeping existing implementation)
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
        'favoriteOpening': '',
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

# Keep all existing authentication and profile routes...
# (All the existing routes remain the same)

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

@app.route('/api/update-profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    try:
        data = request.get_json()
        
        update_data = {}
        
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Name cannot be empty'}), 400
            users_collection.update_one(
                {'_id': current_user['_id']},
                {'$set': {'name': name, 'updated_at': datetime.datetime.utcnow()}}
            )
            update_data['name'] = name
            
        if 'bio' in data:
            update_data['bio'] = data['bio'].strip()
            
        if 'country' in data:
            update_data['country'] = data['country'].strip()
            
        if 'favoriteOpening' in data:
            update_data['favoriteOpening'] = data['favoriteOpening'].strip()
            
        if 'preferences' in data:
            update_data['preferences'] = data['preferences']
        
        if update_data:
            update_data['updatedAt'] = datetime.datetime.utcnow()
            
            profiles_collection.update_one(
                {'user_id': current_user['_id']},
                {'$set': update_data}
            )
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': update_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Profile update failed: {str(e)}'}), 500

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

@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password (only for email auth users)"""
    try:
        if current_user.get('auth_provider') == 'google':
            return jsonify({'error': 'Cannot change password for Google authenticated users'}), 400
        
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
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

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    try:
        users_collection.create_index('email', unique=True)
        users_collection.create_index('google_id')
        profiles_collection.create_index('user_id', unique=True)
        games_collection.create_index([('user_id', 1), ('played_at', -1)])
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Error creating indexes: {e}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
