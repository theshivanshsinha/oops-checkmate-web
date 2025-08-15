from flask import Blueprint, request, jsonify
from utils import token_required
from database import (
    chat_rooms_collection, messages_collection, 
    users_collection, profiles_collection
)
from websocket_handlers import emit_new_message, emit_message_read, emit_notification
import datetime
from bson import ObjectId

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat/rooms', methods=['GET'])
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

@chat_bp.route('/chat/room/<friend_id>', methods=['POST'])
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

@chat_bp.route('/chat/messages/<room_id>', methods=['GET'])
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

@chat_bp.route('/chat/send', methods=['POST'])
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
            'type': message_type,
            'roomId': str(room_id)
        }
        
        # Emit new message to chat room via WebSocket
        print(f"Emitting new message to room {room_id}: {message_response}")
        emit_new_message(None, str(room_id), message_response)  # socketio will be passed from main app
        
        # Send notification to other participants
        for participant_id in room['participants']:
            if str(participant_id) != str(current_user['_id']):
                participant_user = users_collection.find_one({'_id': participant_id})
                if participant_user:
                    notification_data = {
                        'type': 'new_message',
                        'title': f'New message from {current_user["name"]}',
                        'message': content[:50] + ('...' if len(content) > 50 else ''),
                        'data': {
                            'roomId': str(room_id),
                            'senderId': str(current_user['_id']),
                            'senderName': current_user['name']
                        },
                        'timestamp': datetime.datetime.utcnow().isoformat()
                    }
                    emit_notification(None, str(participant_id), notification_data)  # socketio will be passed from main app
        
        return jsonify({
            'message': 'Message sent successfully',
            'messageData': message_response
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to send message: {str(e)}'}), 500

@chat_bp.route('/chat/messages/<message_id>/read', methods=['POST'])
@token_required
def mark_message_read(current_user, message_id):
    """Mark a message as read"""
    try:
        message_obj_id = ObjectId(message_id)
        
        # Update message as read
        result = messages_collection.update_one(
            {
                '_id': message_obj_id,
                'sender_id': {'$ne': current_user['_id']}  # Only mark others' messages as read
            },
            {
                '$set': {
                    'read': True,
                    'read_at': datetime.datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            # Get the message to emit read status
            message = messages_collection.find_one({'_id': message_obj_id})
            if message:
                emit_message_read(None, str(message['room_id']), str(current_user['_id']))  # socketio will be passed from main app
        
        return jsonify({'message': 'Message marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to mark message as read: {str(e)}'}), 500
