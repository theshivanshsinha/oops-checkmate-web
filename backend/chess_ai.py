import chess
import random
from config import DEFAULT_AI_DIFFICULTY, MAX_AI_SEARCH_DEPTH

class ChessAI:
    def __init__(self, difficulty=DEFAULT_AI_DIFFICULTY):
        self.difficulty = max(1, min(5, difficulty))
        self.piece_values = {
            chess.PAWN: 100,
            chess.KNIGHT: 320,
            chess.BISHOP: 330,
            chess.ROOK: 500,
            chess.QUEEN: 900,
            chess.KING: 20000,
        }

        # Simplified position tables for faster evaluation
        self.pawn_table = [
            0, 0, 0, 0, 0, 0, 0, 0,
            50, 50, 50, 50, 50, 50, 50, 50,
            10, 10, 20, 30, 30, 20, 10, 10,
            5, 5, 10, 25, 25, 10, 5, 5,
            0, 0, 0, 20, 20, 0, 0, 0,
            5, -5, -10, 0, 0, -10, -5, 5,
            5, 10, 10, -20, -20, 10, 10, 5,
            0, 0, 0, 0, 0, 0, 0, 0
        ]

    def get_position_value(self, piece, square):
        """Simplified position evaluation"""
        if piece.piece_type == chess.PAWN:
            index = square if piece.color == chess.WHITE else 63 - square
            return self.pawn_table[index]
        elif piece.piece_type in [chess.KNIGHT, chess.BISHOP]:
            # Prefer center squares
            file, rank = chess.square_file(square), chess.square_rank(square)
            center_bonus = 10 if 2 <= file <= 5 and 2 <= rank <= 5 else 0
            return center_bonus
        return 0

    def evaluate_position(self, board):
        """Fast position evaluation"""
        if board.is_checkmate():
            return -10000 if board.turn == chess.BLACK else 10000
        
        if board.is_stalemate() or board.is_insufficient_material():
            return 0
        
        score = 0
        
        # Material and basic positional evaluation
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece:
                piece_value = self.piece_values.get(piece.piece_type, 0)
                position_value = self.get_position_value(piece, square)
                total_value = piece_value + position_value
                
                if piece.color == chess.BLACK:
                    score += total_value
                else:
                    score -= total_value
        
        # Mobility bonus (simplified)
        mobility_bonus = len(list(board.legal_moves)) * 5
        score += mobility_bonus if board.turn == chess.BLACK else -mobility_bonus
        
        return score

    def minimax(self, board, depth, alpha, beta, maximizing_player):
        """Optimized minimax with reduced depth for faster play"""
        if depth == 0 or board.is_game_over():
            return self.evaluate_position(board)
        
        moves = list(board.legal_moves)
        
        # Move ordering for better pruning (captures first)
        def move_priority(move):
            if board.is_capture(move):
                return 1000
            return 0
        
        moves.sort(key=move_priority, reverse=True)
        
        if maximizing_player:
            max_eval = float('-inf')
            for move in moves:
                board.push(move)
                eval_score = self.minimax(board, depth - 1, alpha, beta, False)
                board.pop()
                max_eval = max(max_eval, eval_score)
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in moves:
                board.push(move)
                eval_score = self.minimax(board, depth - 1, alpha, beta, True)
                board.pop()
                min_eval = min(min_eval, eval_score)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
            return min_eval

    def get_best_move(self, board):
        """Get the best move with optimized search depth"""
        try:
            moves = list(board.legal_moves)
            if not moves:
                return None
            
            # Reduce search depth for faster play
            search_depth = min(self.difficulty, MAX_AI_SEARCH_DEPTH)
            
            best_move = None
            best_value = float('-inf')
            
            # Add randomness for lower difficulties
            random_factor = (6 - self.difficulty) * 30
            
            # Move ordering for better performance
            def move_priority(move):
                score = 0
                if board.is_capture(move):
                    captured_piece = board.piece_at(move.to_square)
                    if captured_piece:
                        score += self.piece_values.get(captured_piece.piece_type, 0)
                if board.gives_check(move):
                    score += 50
                return score
            
            moves.sort(key=move_priority, reverse=True)
            
            for move in moves:
                board.push(move)
                value = self.minimax(board, search_depth - 1, float('-inf'), float('inf'), False)
                board.pop()
                
                # Add randomness
                if random_factor > 0:
                    value += random.uniform(-random_factor, random_factor)
                
                if value > best_value:
                    best_value = value
                    best_move = move
            
            return best_move
        except Exception as e:
            print(f"Error in get_best_move: {e}")
            moves = list(board.legal_moves)
            return random.choice(moves) if moves else None
