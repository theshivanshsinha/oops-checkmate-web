from pymongo import MongoClient
from config import MONGODB_URI, DATABASE_NAME
import os

# MongoDB connection
try:
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    
    # Collections
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

def create_database_indexes():
    """Create database indexes for better performance"""
    try:
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

def create_upload_directory():
    """Create upload directory if it doesn't exist"""
    from config import UPLOAD_FOLDER
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
