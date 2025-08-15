import datetime
from database import profiles_collection, users_collection

def create_default_profile(user_id):
    """Create default profile for new user"""
    default_profile = {
        'user_id': user_id,
        'bio': '',
        'country': '',
        'location': '',
        'website': '',
        'favoriteOpening': '',
        'profilePhoto': None,
        'stats': {
            'gamesPlayed': 0,
            'wins': 0,
            'losses': 0,
            'draws': 0,
            'rating': 1200,
            'highestRating': 1200,
            'winRate': 0
        },
        'achievements': [],
        'preferences': {
            'theme': 'classic',
            'soundEnabled': True,
            'showCoordinates': True,
            'autoPromoteToQueen': False
        },
        'gameHistory': [],
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    profiles_collection.insert_one(default_profile)
    return default_profile

def check_achievements(user_id, stats, current_achievements):
    """Check and award new achievements"""
    achievements = current_achievements.copy()
    earned_achievement_names = [a['name'] for a in achievements]
    
    possible_achievements = [
        {
            'name': 'First Move',
            'description': 'Play your first game',
            'icon': '🎯',
            'condition': lambda s: s['gamesPlayed'] >= 1
        },
        {
            'name': 'Victory',
            'description': 'Win your first game',
            'icon': '🏆',
            'condition': lambda s: s['wins'] >= 1
        },
        {
            'name': 'Winning Streak',
            'description': 'Win 5 games in a row',
            'icon': '🔥',
            'condition': lambda s: s['wins'] >= 5
        },
        {
            'name': 'Rated Player',
            'description': 'Play 10 rated games',
            'icon': '🎖️',
            'condition': lambda s: s['gamesPlayed'] >= 10
        },
        {
            'name': 'Rising Star',
            'description': 'Reach 1400 rating',
            'icon': '⭐',
            'condition': lambda s: s['rating'] >= 1400
        },
        {
            'name': 'Expert',
            'description': 'Reach 1800 rating',
            'icon': '🎓',
            'condition': lambda s: s['rating'] >= 1800
        },
        {
            'name': 'Chess Master',
            'description': 'Reach 2000 rating',
            'icon': '👑',
            'condition': lambda s: s['rating'] >= 2000
        }
    ]
    
    for achievement in possible_achievements:
        if achievement['name'] not in earned_achievement_names:
            if achievement['condition'](stats):
                achievements.append({
                    'name': achievement['name'],
                    'description': achievement['description'],
                    'icon': achievement['icon'],
                    'earnedAt': datetime.datetime.utcnow()
                })
    
    return achievements
