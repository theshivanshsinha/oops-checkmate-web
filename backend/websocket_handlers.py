import datetime
import time
import threading
import jwt
from flask_socketio import emit, join_room, leave_room
from flask import request
from config import SECRET_KEY, CLEANUP_INTERVAL, USER_INACTIVITY_TIMEOUT
from database import users_collection, messages_collection, chat_rooms_collection

# Online users tracking
online_users = {}  # {user_id: {'socket_id': socket_id, 'last_seen': timestamp}}

def handle_connect(socketio):
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    # Get token from auth data
    auth_data = request.args.get('token') or request.headers.get('Authorization')
    if auth_data and auth_data.startswith('Bearer '):
        token = auth_data.split(' ')[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload['user_id']
            print(f"Authenticated user {user_id} connected")
        except Exception as e:
            print(f"Authentication failed: {e}")
    else:
        print("No authentication token provided")

def handle_disconnect(socketio):
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")
    # Remove user from online users
    user_id = None
    for uid, data in online_users.items():
        if data['socket_id'] == request.sid:
            user_id = uid
            break
    
    if user_id:
        del online_users[user_id]
        # Notify other users about offline status
        emit('user_offline', {'user_id': user_id}, broadcast=True, include_self=False)

def handle_user_login(socketio, data):
    """Handle user login and set online status"""
    try:
        token = data.get('token')
        if not token:
            return
        
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Add user to online users
        online_users[user_id] = {
            'socket_id': request.sid,
            'last_seen': datetime.datetime.utcnow()
        }
        
        # Join user to their personal room
        join_room(f"user_{user_id}")
        
        # Notify other users about online status
        emit('user_online', {'user_id': user_id}, broadcast=True, include_self=False)
        
        print(f"User {user_id} logged in and is online")
        
    except Exception as e:
        print(f"Error in user_login: {e}")

def handle_join_chat_room(socketio, data):
    """Join a specific chat room"""
    try:
        room_id = data.get('room_id')
        if room_id:
            join_room(f"chat_room_{room_id}")
            print(f"User joined chat room: {room_id}")
    except Exception as e:
        print(f"Error joining chat room: {e}")

def handle_leave_chat_room(socketio, data):
    """Leave a specific chat room"""
    try:
        room_id = data.get('room_id')
        if room_id:
            leave_room(f"chat_room_{room_id}")
            print(f"User left chat room: {room_id}")
    except Exception as e:
        print(f"Error leaving chat room: {e}")

def handle_typing(socketio, data):
    """Handle typing indicator"""
    try:
        room_id = data.get('room_id')
        user_id = data.get('user_id')
        is_typing = data.get('is_typing', False)
        
        if room_id and user_id:
            emit('user_typing', {
                'room_id': room_id,
                'user_id': user_id,
                'is_typing': is_typing
            }, room=f"chat_room_{room_id}", include_self=False)
    except Exception as e:
        print(f"Error handling typing: {e}")

def emit_new_message(socketio, room_id, message_data):
    """Emit new message to chat room"""
    try:
        print(f"Emitting to room chat_room_{room_id}")
        socketio.emit('new_message', message_data, room=f"chat_room_{room_id}")
        print(f"Message emitted successfully")
    except Exception as e:
        print(f"Error emitting new message: {e}")

def emit_message_read(socketio, room_id, user_id):
    """Emit message read status"""
    try:
        socketio.emit('message_read', {
            'room_id': room_id,
            'user_id': user_id
        }, room=f"chat_room_{room_id}")
    except Exception as e:
        print(f"Error emitting message read: {e}")

def emit_notification(socketio, user_id, notification_data):
    """Emit notification to specific user"""
    try:
        socketio.emit('new_notification', notification_data, room=f"user_{user_id}")
    except Exception as e:
        print(f"Error emitting notification: {e}")

def cleanup_inactive_users(socketio):
    """Remove users who haven't been active for 5 minutes"""
    while True:
        try:
            current_time = datetime.datetime.utcnow()
            inactive_users = []
            
            for user_id, data in online_users.items():
                if (current_time - data['last_seen']).total_seconds() > USER_INACTIVITY_TIMEOUT:
                    inactive_users.append(user_id)
            
            for user_id in inactive_users:
                del online_users[user_id]
                emit('user_offline', {'user_id': user_id}, broadcast=True, include_self=False)
                print(f"User {user_id} marked as offline due to inactivity")
            
            time.sleep(CLEANUP_INTERVAL)  # Check every minute
            
        except Exception as e:
            print(f"Error in cleanup task: {e}")
            time.sleep(CLEANUP_INTERVAL)

def start_cleanup_thread(socketio):
    """Start cleanup thread"""
    cleanup_thread = threading.Thread(target=lambda: cleanup_inactive_users(socketio), daemon=True)
    cleanup_thread.start()
