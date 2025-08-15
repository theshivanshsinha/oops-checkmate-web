from flask import Blueprint, request, jsonify, send_file
from utils import token_required, resize_and_crop_image
from database import profiles_collection, users_collection, games_collection
from models import create_default_profile, check_achievements
import datetime
import json
import tempfile
import base64

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
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

@profile_bp.route('/update-profile', methods=['PUT', 'OPTIONS'])
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

@profile_bp.route('/update-game-stats', methods=['POST'])
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

@profile_bp.route('/game-history', methods=['GET'])
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

@profile_bp.route('/upload-profile-photo', methods=['POST', 'OPTIONS'])
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

@profile_bp.route('/export-game-data', methods=['GET', 'OPTIONS'])
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
