from flask import Blueprint, request, jsonify
from utils import token_required
from chess_ai import ChessAI
import chess

chess_bp = Blueprint('chess', __name__)

@chess_bp.route('/make-move', methods=['POST'])
@token_required
def make_move(current_user):
    """Handle player move"""
    try:
        data = request.get_json()
        move_str = data.get('move')
        fen = data.get('fen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        
        if not move_str:
            return jsonify({'error': 'Move is required'}), 400
        
        # Create board from FEN
        board = chess.Board(fen)
        
        # Check if move captures a piece
        captured_piece = None
        if board.is_capture(chess.Move.from_uci(move_str)):
            target_square = chess.Move.from_uci(move_str).to_square
            if board.is_en_passant(chess.Move.from_uci(move_str)):
                captured_piece = 'p'  # En passant always captures a pawn
            else:
                piece_at_target = board.piece_at(target_square)
                if piece_at_target:
                    captured_piece = piece_at_target.symbol()
        
        # Parse and validate move
        try:
            move = chess.Move.from_uci(move_str)
            if move not in board.legal_moves:
                return jsonify({'error': 'Illegal move'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid move format'}), 400
        
        # Make the move
        board.push(move)
        
        # Check game status
        game_status = "playing"
        result = None
        
        if board.is_checkmate():
            game_status = "ended"
            result = "win" if board.turn == chess.BLACK else "loss"
        elif board.is_stalemate() or board.is_insufficient_material():
            game_status = "ended"
            result = "draw"
        
        return jsonify({
            'fen': board.fen(),
            'isPlayerTurn': False,
            'gameStatus': game_status,
            'result': result,
            'isCheck': board.is_check(),
            'move': move_str,
            'capturedPiece': captured_piece
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to make move: {str(e)}'}), 500

@chess_bp.route('/ai-move', methods=['POST'])
@token_required
def ai_move(current_user):
    """Get AI move"""
    try:
        data = request.get_json()
        fen = data.get('fen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        difficulty = data.get('difficulty', 3)
        
        # Create board from FEN
        board = chess.Board(fen)
        
        # Initialize AI
        ai = ChessAI(difficulty)
        
        # Get AI move
        ai_move = ai.get_best_move(board)
        
        if not ai_move:
            return jsonify({'error': 'No legal moves available'}), 400
        
        # Check if AI move captures a piece
        captured_piece = None
        if board.is_capture(ai_move):
            target_square = ai_move.to_square
            if board.is_en_passant(ai_move):
                captured_piece = 'P'  # En passant always captures a pawn (uppercase for white)
            else:
                piece_at_target = board.piece_at(target_square)
                if piece_at_target:
                    captured_piece = piece_at_target.symbol()
        
        # Make the AI move
        board.push(ai_move)
        
        # Check game status
        game_status = "playing"
        result = None
        
        if board.is_checkmate():
            game_status = "ended"
            result = "loss" if board.turn == chess.WHITE else "win"
        elif board.is_stalemate() or board.is_insufficient_material():
            game_status = "ended"
            result = "draw"
        
        return jsonify({
            'fen': board.fen(),
            'isPlayerTurn': True,
            'gameStatus': game_status,
            'result': result,
            'isCheck': board.is_check(),
            'aiMove': ai_move.uci(),
            'capturedPiece': captured_piece
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get AI move: {str(e)}'}), 500
