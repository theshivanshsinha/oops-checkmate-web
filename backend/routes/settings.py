from flask import Blueprint, request, jsonify
from utils import token_required
from werkzeug.security import generate_password_hash, check_password_hash
from database import (
    users_collection, privacy_settings_collection,
    profiles_collection, friends_collection, friend_requests_collection,
    newsletter_subscriptions_collection, games_collection,
    achievements_collection, messages_collection, chat_rooms_collection
)
import datetime

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/change-password', methods=['POST'])
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

@settings_bp.route('/delete-account', methods=['DELETE'])
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

@settings_bp.route('/privacy-settings', methods=['GET'])
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

@settings_bp.route('/privacy-settings', methods=['PUT'])
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
