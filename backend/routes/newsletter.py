from flask import Blueprint, request, jsonify
from utils import token_required
from database import newsletter_subscriptions_collection
import datetime

newsletter_bp = Blueprint('newsletter', __name__)

@newsletter_bp.route('/newsletters', methods=['GET'])
@token_required
def get_newsletters(current_user):
    """Get available newsletters"""
    try:
        # Get user's subscriptions
        subscriptions = list(newsletter_subscriptions_collection.find({
            'user_id': current_user['_id']
        }))
        
        subscribed_newsletter_ids = [sub['newsletter_id'] for sub in subscriptions]
        
        # Mock newsletter data (you can replace with actual database)
        newsletters = [
            {
                'id': 1,
                'name': 'Chess Daily',
                'description': 'Daily chess puzzles, tips, and news from the chess world',
                'subscribers': '125K',
                'frequency': 'Daily',
                'category': 'General',
                'subscribed': 1 in subscribed_newsletter_ids
            },
            {
                'id': 2,
                'name': 'Opening Mastery',
                'description': 'Deep dive into chess openings with grandmaster analysis',
                'subscribers': '89K',
                'frequency': 'Weekly',
                'category': 'Education',
                'subscribed': 2 in subscribed_newsletter_ids
            },
            {
                'id': 3,
                'name': 'Tournament Updates',
                'description': 'Latest news from major chess tournaments worldwide',
                'subscribers': '156K',
                'frequency': 'Bi-weekly',
                'category': 'News',
                'subscribed': 3 in subscribed_newsletter_ids
            },
            {
                'id': 4,
                'name': 'Endgame Excellence',
                'description': 'Master endgame techniques with expert guidance',
                'subscribers': '67K',
                'frequency': 'Weekly',
                'category': 'Education',
                'subscribed': 4 in subscribed_newsletter_ids
            }
        ]
        
        return jsonify({'newsletters': newsletters}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch newsletters: {str(e)}'}), 500

@newsletter_bp.route('/subscribe-newsletter', methods=['POST'])
@token_required
def subscribe_newsletter(current_user):
    """Subscribe/unsubscribe to newsletter"""
    try:
        data = request.get_json()
        newsletter_id = data.get('newsletterId')
        
        # Check if already subscribed
        existing_subscription = newsletter_subscriptions_collection.find_one({
            'user_id': current_user['_id'],
            'newsletter_id': newsletter_id
        })
        
        if existing_subscription:
            # Unsubscribe
            newsletter_subscriptions_collection.delete_one({
                'user_id': current_user['_id'],
                'newsletter_id': newsletter_id
            })
            subscribed = False
            message = 'Unsubscribed successfully'
        else:
            # Subscribe
            newsletter_subscriptions_collection.insert_one({
                'user_id': current_user['_id'],
                'newsletter_id': newsletter_id,
                'subscribed_at': datetime.datetime.utcnow()
            })
            subscribed = True
            message = 'Subscribed successfully'
        
        return jsonify({
            'message': message,
            'newsletterId': newsletter_id,
            'subscribed': subscribed
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update subscription: {str(e)}'}), 500
