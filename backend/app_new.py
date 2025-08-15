from flask import Flask, request, make_response
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
import os

# Import configuration and database
from config import ALLOWED_ORIGINS, SECRET_KEY, UPLOAD_FOLDER, MAX_FILE_SIZE
from database import create_database_indexes, create_upload_directory

# Import route blueprints
from routes.auth import auth_bp
from routes.chess import chess_bp
from routes.profile import profile_bp
from routes.chat import chat_bp
from routes.friends import friends_bp
from routes.settings import settings_bp
from routes.newsletter import newsletter_bp

# Import WebSocket handlers
from websocket_handlers import (
    handle_connect, handle_disconnect, handle_user_login,
    handle_join_chat_room, handle_leave_chat_room, handle_typing,
    emit_new_message, emit_message_read, emit_notification,
    start_cleanup_thread
)

app = Flask(__name__)

# Configure Flask app
app.config['SECRET_KEY'] = SECRET_KEY
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Enhanced CORS configuration
CORS(app, origins=ALLOWED_ORIGINS)

# SocketIO configuration
socketio = SocketIO(
    app, 
    cors_allowed_origins=ALLOWED_ORIGINS, 
    async_mode='eventlet', 
    logger=True, 
    engineio_logger=True
)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(chess_bp, url_prefix='/api')
app.register_blueprint(profile_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(friends_bp, url_prefix='/api')
app.register_blueprint(settings_bp, url_prefix='/api')
app.register_blueprint(newsletter_bp, url_prefix='/api')

# Handle preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.after_request
def after_request(response):
    response.headers.add('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
    response.headers.add('Cross-Origin-Embedder-Policy', 'require-corp')
    return response

# WebSocket Event Handlers
@socketio.on('connect')
def on_connect():
    handle_connect(socketio)

@socketio.on('disconnect')
def on_disconnect():
    handle_disconnect(socketio)

@socketio.on('user_login')
def on_user_login(data):
    handle_user_login(socketio, data)

@socketio.on('join_chat_room')
def on_join_chat_room(data):
    handle_join_chat_room(socketio, data)

@socketio.on('leave_chat_room')
def on_leave_chat_room(data):
    handle_leave_chat_room(socketio, data)

@socketio.on('typing')
def on_typing(data):
    handle_typing(socketio, data)

# Update WebSocket handler functions to use the socketio instance
def emit_new_message_wrapper(room_id, message_data):
    """Wrapper to emit new message with socketio instance"""
    emit_new_message(socketio, room_id, message_data)

def emit_message_read_wrapper(room_id, user_id):
    """Wrapper to emit message read with socketio instance"""
    emit_message_read(socketio, room_id, user_id)

def emit_notification_wrapper(user_id, notification_data):
    """Wrapper to emit notification with socketio instance"""
    emit_notification(socketio, user_id, notification_data)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return {'error': 'Endpoint not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal server error'}, 500

@app.errorhandler(413)
def file_too_large(error):
    return {'error': 'File too large. Maximum size is 5MB'}, 413

# Main application runner
if __name__ == '__main__':
    try:
        # Create upload directory
        create_upload_directory()
        
        # Create database indexes
        create_database_indexes()
        
        # Start cleanup thread
        start_cleanup_thread(socketio)
        
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Error during initialization: {e}")
    
    print("Starting Chess App API Server...")
    print("Available endpoints:")
    print("- Authentication: /api/signup, /api/login, /api/google-auth")
    print("- Profile: /api/profile, /api/update-profile, /api/upload-profile-photo")
    print("- Chess: /api/make-move, /api/ai-move")
    print("- Chat: /api/chat/*")
    print("- Settings: /api/change-password, /api/delete-account, /api/privacy-settings")
    print("- Data: /api/export-game-data, /api/game-history")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
