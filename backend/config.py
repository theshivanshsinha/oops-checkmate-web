import os
from datetime import timedelta

# Flask Configuration
SECRET_KEY = 'f23a3fc8e3bc0e4f4e9b7a2bfae81e293217a884f43c038bce2f1932299b3ff1'
GOOGLE_CLIENT_ID = '612587465923-6svijnd7e3o1hn9jj1tdnlpvksun9j1p.apps.googleusercontent.com'

# CORS Configuration
ALLOWED_ORIGINS = [
    "https://oops-checkmate-web-1.onrender.com", 
    "http://localhost:3000"
]

# File Upload Configuration
UPLOAD_FOLDER = 'uploads/profile_photos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# JWT Configuration
JWT_EXPIRATION_DELTA = timedelta(days=7)

# MongoDB Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DATABASE_NAME = 'chess_app'

# Chess AI Configuration
DEFAULT_AI_DIFFICULTY = 3
MAX_AI_SEARCH_DEPTH = 3

# WebSocket Configuration
CLEANUP_INTERVAL = 60  # seconds
USER_INACTIVITY_TIMEOUT = 300  # 5 minutes
