import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from bson import ObjectId
from PIL import Image
import base64
import io
from config import SECRET_KEY, ALLOWED_EXTENSIONS, JWT_EXPIRATION_DELTA

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_and_crop_image(image_data, size=(200, 200)):
    """Resize and crop image from base64 data"""
    try:
        # Decode base64 image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data)
        
        # Open image with PIL
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Calculate crop box to maintain aspect ratio
        width, height = img.size
        min_dimension = min(width, height)
        
        left = (width - min_dimension) // 2
        top = (height - min_dimension) // 2
        right = left + min_dimension
        bottom = top + min_dimension
        
        # Crop to square
        img = img.crop((left, top, right, bottom))
        
        # Resize to target size
        img = img.resize(size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85, optimize=True)
        img_byte_arr = img_byte_arr.getvalue()
        
        return img_byte_arr
    except Exception as e:
        raise Exception(f"Image processing failed: {str(e)}")

def token_required(f):
    """JWT token decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            from database import users_collection
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
        'exp': datetime.datetime.utcnow() + JWT_EXPIRATION_DELTA,
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
