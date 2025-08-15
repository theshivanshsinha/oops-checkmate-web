# Chess App Backend - Modular Structure

This document describes the new modular structure of the Chess App backend, which has been refactored from a single large `app.py` file into multiple organized modules.

## Project Structure

```
backend/
├── app_new.py              # Main application entry point
├── config.py               # Configuration settings
├── database.py             # Database connection and initialization
├── utils.py                # Utility functions and helpers
├── chess_ai.py             # Chess AI engine
├── models.py               # Data models and helper functions
├── websocket_handlers.py   # WebSocket event handlers
├── routes/                 # API route blueprints
│   ├── auth.py            # Authentication routes
│   ├── chess.py           # Chess game routes
│   ├── profile.py         # User profile routes
│   ├── chat.py            # Chat system routes
│   └── friends.py         # Friends system routes
└── requirements.txt        # Python dependencies
```

## Module Descriptions

### Core Modules

#### `app_new.py`
- Main Flask application entry point
- Configures Flask app, CORS, and SocketIO
- Registers all route blueprints
- Sets up WebSocket event handlers
- Contains error handlers and main application runner

#### `config.py`
- Centralized configuration settings
- Flask app configuration
- CORS settings
- File upload settings
- JWT configuration
- MongoDB connection settings
- Chess AI settings
- WebSocket settings

#### `database.py`
- MongoDB connection setup
- Database collection definitions
- Database index creation
- Upload directory creation

#### `utils.py`
- Common utility functions
- JWT token generation and validation
- Image processing functions
- Authentication decorators

#### `chess_ai.py`
- Chess AI engine implementation
- Position evaluation
- Minimax algorithm with alpha-beta pruning
- Move generation and analysis

#### `models.py`
- Data model definitions
- Default profile creation
- Achievement checking logic

#### `websocket_handlers.py`
- WebSocket event handlers
- Online user tracking
- Real-time messaging
- User status management
- Cleanup tasks

### Route Modules

#### `routes/auth.py`
- User registration and login
- Google OAuth integration
- Token verification
- Password management

#### `routes/chess.py`
- Chess move validation
- AI move generation
- Game state management

#### `routes/profile.py`
- User profile management
- Profile photo upload
- Game statistics
- Data export functionality

#### `routes/chat.py`
- Chat room management
- Message sending and retrieval
- Real-time messaging
- Message read status

#### `routes/friends.py`
- Friend request management
- User search functionality
- Friend suggestions
- Friendship status tracking

## Benefits of Modular Structure

1. **Maintainability**: Each module has a single responsibility
2. **Readability**: Code is organized by functionality
3. **Scalability**: Easy to add new features and modules
4. **Testing**: Individual modules can be tested in isolation
5. **Collaboration**: Multiple developers can work on different modules
6. **Debugging**: Easier to locate and fix issues

## Migration Guide

To use the new modular structure:

1. **Backup the original app.py**:
   ```bash
   cp app.py app_original.py
   ```

2. **Rename the new app file**:
   ```bash
   mv app_new.py app.py
   ```

3. **Install dependencies** (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

## API Endpoints

The API endpoints remain the same, but are now organized by functionality:

### Authentication (`/api`)
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/google-auth` - Google OAuth
- `GET /api/verify-token` - Token verification

### Chess (`/api`)
- `POST /api/make-move` - Player move
- `POST /api/ai-move` - AI move

### Profile (`/api`)
- `GET /api/profile` - Get user profile
- `PUT /api/update-profile` - Update profile
- `POST /api/upload-profile-photo` - Upload photo
- `POST /api/update-game-stats` - Update game stats
- `GET /api/game-history` - Get game history
- `GET /api/export-game-data` - Export data

### Chat (`/api/chat`)
- `GET /api/chat/rooms` - Get chat rooms
- `POST /api/chat/room/<friend_id>` - Create/get chat room
- `GET /api/chat/messages/<room_id>` - Get messages
- `POST /api/chat/send` - Send message
- `POST /api/chat/messages/<message_id>/read` - Mark as read

### Friends (`/api`)
- `GET /api/friends` - Get friends list
- `GET /api/friend-requests/incoming` - Get incoming requests
- `GET /api/friend-requests/outgoing` - Get outgoing requests
- `GET /api/friend-suggestions` - Get suggestions
- `POST /api/send-friend-request` - Send request
- `POST /api/accept-friend-request` - Accept request
- `POST /api/decline-friend-request` - Decline request
- `POST /api/cancel-friend-request` - Cancel request
- `POST /api/remove-friend` - Remove friend
- `GET /api/search-users` - Search users

## WebSocket Events

- `connect` - Client connection
- `disconnect` - Client disconnection
- `user_login` - User login
- `join_chat_room` - Join chat room
- `leave_chat_room` - Leave chat room
- `typing` - Typing indicator

## Configuration

All configuration is centralized in `config.py`. Key settings include:

- `SECRET_KEY` - Flask secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `ALLOWED_ORIGINS` - CORS allowed origins
- `MONGODB_URI` - MongoDB connection string
- `UPLOAD_FOLDER` - File upload directory
- `MAX_FILE_SIZE` - Maximum file size for uploads

## Development

To add new features:

1. Create a new route file in the `routes/` directory
2. Define the blueprint and routes
3. Import and register the blueprint in `app_new.py`
4. Add any necessary utility functions to `utils.py`
5. Update this README with new endpoints

## Testing

Each module can be tested independently. Consider creating a `tests/` directory with test files for each module.

## Deployment

The modular structure makes deployment easier:

1. All dependencies are in `requirements.txt`
2. Configuration is centralized
3. Database initialization is automated
4. Error handling is consistent across modules

## Troubleshooting

Common issues and solutions:

1. **Import errors**: Ensure all modules are in the correct directories
2. **Database connection**: Check MongoDB URI in `config.py`
3. **CORS issues**: Verify `ALLOWED_ORIGINS` in `config.py`
4. **WebSocket issues**: Check SocketIO configuration in `app_new.py`

## Future Enhancements

Potential improvements for the modular structure:

1. Add logging configuration
2. Implement caching layer
3. Add rate limiting
4. Create API documentation
5. Add comprehensive testing
6. Implement monitoring and metrics
