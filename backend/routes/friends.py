from flask import Blueprint, request, jsonify
from utils import token_required
from database import (
    friends_collection, friend_requests_collection,
    users_collection, profiles_collection
)
import datetime
from bson import ObjectId

friends_bp = Blueprint('friends', __name__)

@friends_bp.route('/friends', methods=['GET'])
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

@friends_bp.route('/friend-requests/incoming', methods=['GET'])
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

@friends_bp.route('/friend-requests/outgoing', methods=['GET'])
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

@friends_bp.route('/friend-suggestions', methods=['GET'])
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

@friends_bp.route('/send-friend-request', methods=['POST'])
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

@friends_bp.route('/accept-friend-request', methods=['POST'])
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

@friends_bp.route('/decline-friend-request', methods=['POST'])
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

@friends_bp.route('/cancel-friend-request', methods=['POST'])
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

@friends_bp.route('/remove-friend', methods=['POST'])
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

@friends_bp.route('/search-users', methods=['GET'])
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
