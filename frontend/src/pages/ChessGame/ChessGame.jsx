import React, { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useDispatch, useSelector } from "react-redux";
import {
  makeMove,
  getAIMove,
  clearCurrentGame,
  setAIDifficulty,
  saveGameResult,
  updateGameTime,
  setGameStarted,
  addMoveToHistory,
  resignGame as resignGameAction,
} from "../../store/slices/gameSlice";
import {
  RotateCcw,
  Flag,
  Crown,
  Clock,
  Settings,
  Volume2,
  VolumeX,
  Home,
  Trophy,
  Target,
  Zap,
} from "lucide-react";

export default function ChessGame() {
  const dispatch = useDispatch();
  const { currentGame, aiDifficulty, error } = useSelector(
    (state) => state.game
  );

  const [game, setGame] = useState(new Chess());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastMove, setLastMove] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  // Update local game state when Redux state changes
  useEffect(() => {
    if (currentGame.fen) {
      const newGame = new Chess(currentGame.fen);
      setGame(newGame);
    }
  }, [currentGame.fen]);

  // Timer effect - now uses Redux state
  useEffect(() => {
    let interval;
    if (currentGame.isGameStarted && currentGame.gameStatus === "playing") {
      interval = setInterval(() => {
        dispatch(updateGameTime(currentGame.gameTime + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [
    currentGame.isGameStarted,
    currentGame.gameStatus,
    currentGame.gameTime,
    dispatch,
  ]);

  // AI move effect - trigger AI move when it's AI's turn
  useEffect(() => {
    if (
      !currentGame.isPlayerTurn &&
      currentGame.gameStatus === "playing" &&
      !currentGame.isAIThinking
    ) {
      // Add delay for better UX
      const timer = setTimeout(() => {
        dispatch(getAIMove({ fen: currentGame.fen, difficulty: aiDifficulty }));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    currentGame.isPlayerTurn,
    currentGame.gameStatus,
    currentGame.isAIThinking,
    currentGame.fen,
    aiDifficulty,
    dispatch,
  ]);

  // Play sound effect
  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return;

      const audio = new Audio();
      switch (type) {
        case "move":
          audio.src =
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2wm0fAjqAzvLZiTYIG2u46KKWQA0PUqru8LBmGgU+kNr0yXcpBC12xfDgl0QKC1Sp5O+4WhcFQZLS9s92JAgzc8bv3ZY7CQVVtOjtyHgkBjOLzvfaeSkGdQA";
          break;
        case "capture":
          audio.src =
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2wm0fAjqAzvLZiTYIG2u46KKWQA0PUqru8LBmGgU+kNr0yXcpBC12xfDgl0QKC1Sp5O+4WhcFQZLS9s92JAgzc8bv3ZY7CQVVtOjtyHgkBjOLzvfaeSkGdQA";
          break;
        case "check":
          audio.src =
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2wm0fAjqAzvLZiTYIG2u46KKWQA0PUqru8LBmGgU+kNr0yXcpBC12xfDgl0QKC1Sp5O+4WhcFQZLS9s92JAgzc8bv3ZY7CQVVtOjtyHgkBjOLzvfaeSkGdQA";
          break;
        default:
          return;
      }
      audio.play().catch(() => {});
    },
    [soundEnabled]
  );

  // Handle piece drop
  const onDrop = useCallback(
    async (sourceSquare, targetSquare) => {
      if (
        !currentGame.isPlayerTurn ||
        currentGame.gameStatus !== "playing" ||
        currentGame.isAIThinking
      ) {
        return false;
      }

      try {
        const move = `${sourceSquare}${targetSquare}`;

        // Check if move captures a piece
        const tempGame = new Chess(currentGame.fen);
        const moveObj = tempGame.move({ from: sourceSquare, to: targetSquare });
        const capturedPiece = moveObj?.captured;

        // Dispatch the move action
        const result = await dispatch(
          makeMove({
            move,
            fen: currentGame.fen,
          })
        ).unwrap();

        // Update local state
        setLastMove({ from: sourceSquare, to: targetSquare });

        // Add move to history in Redux
        const newGame = new Chess(result.fen);
        const historyMoveObj = {
          san: newGame.history().slice(-1)[0],
          from: sourceSquare,
          to: targetSquare,
          color: "w",
        };
        dispatch(addMoveToHistory(historyMoveObj));

        // Start game if not started
        if (!currentGame.isGameStarted) {
          dispatch(setGameStarted(true));
        }

        // Play sound effects
        if (capturedPiece) {
          playSound("capture");
        } else if (newGame.inCheck()) {
          playSound("check");
        } else {
          playSound("move");
        }

        // Handle game end
        if (result.gameStatus === "ended") {
          await dispatch(
            saveGameResult({
              result: result.result,
              gameData: {
                opponent_rating: 1200 + (aiDifficulty - 1) * 200,
                game_type: "casual",
              },
            })
          );
        }

        return true;
      } catch (error) {
        console.error("Move failed:", error);
        return false;
      }
    },
    [currentGame, dispatch, aiDifficulty, playSound]
  );

  // Handle AI move completion
  useEffect(() => {
    if (currentGame.gameHistory.length > 0) {
      const lastMove =
        currentGame.gameHistory[currentGame.gameHistory.length - 1];
      if (lastMove.color === "b") {
        // AI just moved, add to history and play sound
        const newGame = new Chess(currentGame.fen);

        // Check for captures or checks to play appropriate sound
        if (newGame.inCheck()) {
          playSound("check");
        } else {
          // Check if last move was a capture by looking at captured pieces
          const totalCaptured =
            currentGame.capturedPieces.white.length +
            currentGame.capturedPieces.black.length;
          if (totalCaptured > 0) {
            playSound("capture");
          } else {
            playSound("move");
          }
        }
      }
    }
  }, [
    currentGame.gameHistory,
    currentGame.fen,
    currentGame.capturedPieces,
    playSound,
  ]);

  // New game
  const startNewGame = useCallback(() => {
    dispatch(clearCurrentGame());
    setGame(new Chess());
    setLastMove(null);
    setShowResignConfirm(false);
  }, [dispatch]);

  // Resign game
  const resignGame = useCallback(async () => {
    dispatch(resignGameAction());
    await dispatch(
      saveGameResult({
        result: "loss",
        gameData: {
          opponent_rating: 1200 + (aiDifficulty - 1) * 200,
          game_type: "casual",
        },
      })
    );
    setShowResignConfirm(false);
  }, [dispatch, aiDifficulty]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get piece symbol
  const getPieceSymbol = (piece) => {
    const symbols = {
      p: "♟",
      n: "♞",
      b: "♝",
      r: "♜",
      q: "♛",
      k: "♚",
      P: "♙",
      N: "♘",
      B: "♗",
      R: "♖",
      Q: "♕",
      K: "♔",
    };
    return symbols[piece] || piece;
  };

  // Difficulty levels
  const difficultyLevels = [
    { value: 1, label: "Beginner", icon: "🎯" },
    { value: 2, label: "Easy", icon: "🎮" },
    { value: 3, label: "Medium", icon: "🎲" },
    { value: 4, label: "Hard", icon: "🎖️" },
    { value: 5, label: "Expert", icon: "👑" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200"
              >
                <Home size={18} />
                Home
              </button>
              <h1 className="text-2xl font-bold">Chess vs AI</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} />
                {formatTime(currentGame.gameTime)}
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/10 rounded-lg transition duration-200"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Resign Confirmation Modal */}
        {showResignConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Resign Game?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to resign? This will count as a loss.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resignGame}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition duration-200"
                >
                  Yes, Resign
                </button>
                <button
                  onClick={() => setShowResignConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-md rounded-3xl p-6">
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Crown size={20} className="text-yellow-400" />
                    <span className="font-medium">
                      AI (
                      {
                        difficultyLevels.find((d) => d.value === aiDifficulty)
                          ?.label
                      }
                      )
                    </span>
                  </div>
                  {currentGame.isAIThinking && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Zap size={16} className="animate-pulse" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={startNewGame}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition duration-200"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setShowResignConfirm(true)}
                    disabled={currentGame.gameStatus !== "playing"}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition duration-200"
                  >
                    <Flag size={16} />
                  </button>
                </div>
              </div>

              <div className="aspect-square max-w-2xl mx-auto">
                <Chessboard
                  position={currentGame.fen}
                  onPieceDrop={onDrop}
                  customBoardStyle={{
                    borderRadius: "8px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  }}
                  customSquareStyles={{
                    ...(lastMove && {
                      [lastMove.from]: {
                        backgroundColor: "rgba(255, 255, 0, 0.4)",
                      },
                      [lastMove.to]: {
                        backgroundColor: "rgba(255, 255, 0, 0.4)",
                      },
                    }),
                  }}
                />
              </div>

              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Target size={20} className="text-green-400" />
                  <span className="font-medium">You (White)</span>
                  {currentGame.isPlayerTurn &&
                    currentGame.gameStatus === "playing" &&
                    !currentGame.isAIThinking && (
                      <span className="text-green-400 text-sm">Your turn</span>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Status */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Game Status</h3>

              {currentGame.result ? (
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <Trophy size={24} className="mx-auto mb-2 text-yellow-400" />
                  <p className="font-bold text-yellow-400">
                    {currentGame.result === "win"
                      ? "You win!"
                      : currentGame.result === "loss"
                      ? "AI wins!"
                      : "Game drawn!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold text-green-400">
                      {currentGame.gameStatus === "playing"
                        ? "In Progress"
                        : "Ended"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turn:</span>
                    <span className="font-bold">
                      {currentGame.isAIThinking
                        ? "AI Thinking"
                        : currentGame.isPlayerTurn
                        ? "Your Turn"
                        : "AI Turn"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moves:</span>
                    <span className="font-bold">
                      {currentGame.gameHistory.length}
                    </span>
                  </div>
                  {game.inCheck() && (
                    <div className="text-red-400 font-bold text-center">
                      CHECK!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Captured Pieces - Now uses Redux state */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Captured Pieces</h3>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Captured by You:
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[32px]">
                    {currentGame.capturedPieces.black.map((piece, index) => (
                      <span key={index} className="text-2xl">
                        {getPieceSymbol(piece)}
                      </span>
                    ))}
                    {currentGame.capturedPieces.black.length === 0 && (
                      <span className="text-gray-500 text-sm">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Captured by AI:
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[32px]">
                    {currentGame.capturedPieces.white.map((piece, index) => (
                      <span key={index} className="text-2xl">
                        {getPieceSymbol(piece)}
                      </span>
                    ))}
                    {currentGame.capturedPieces.white.length === 0 && (
                      <span className="text-gray-500 text-sm">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      AI Difficulty
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) =>
                        dispatch(setAIDifficulty(parseInt(e.target.value)))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      {difficultyLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.icon} {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Sound Effects</label>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-2 rounded-lg transition duration-200 ${
                        soundEnabled ? "bg-green-500" : "bg-gray-600"
                      }`}
                    >
                      {soundEnabled ? (
                        <Volume2 size={16} />
                      ) : (
                        <VolumeX size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Move History - Now uses Redux state */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Move History</h3>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {currentGame.gameHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No moves yet</p>
                ) : (
                  currentGame.gameHistory.map((move, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {Math.floor(index / 2) + 1}.
                      </span>
                      <span className="font-mono">{move.san}</span>
                      <span className="text-gray-400">
                        {move.color === "w" ? "You" : "AI"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
