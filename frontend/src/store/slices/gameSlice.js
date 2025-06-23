import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Make player move
export const makeMove = createAsyncThunk(
  "game/makeMove",
  async ({ move, fen }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/make-move`,
        {
          move,
          fen,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to make move"
      );
    }
  }
);

// Get AI move
export const getAIMove = createAsyncThunk(
  "game/getAIMove",
  async ({ fen, difficulty }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/ai-move`,
        {
          fen,
          difficulty: difficulty || 3,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to get AI move"
      );
    }
  }
);

// Fetch game history
export const fetchGameHistory = createAsyncThunk(
  "game/fetchGameHistory",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/game-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch game history"
      );
    }
  }
);

// Save game result
export const saveGameResult = createAsyncThunk(
  "game/saveGameResult",
  async ({ result, gameData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/update-game-stats`,
        {
          result,
          opponent_rating: 1200,
          game_type: "casual",
          ...gameData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to save game result"
      );
    }
  }
);

const gameSlice = createSlice({
  name: "game",
  initialState: {
    history: [],
    currentGame: {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      moves: [],
      isPlayerTurn: true,
      gameStatus: "playing",
      result: null,
      isAIThinking: false,
      // Add captured pieces to Redux state
      capturedPieces: {
        white: [],
        black: [],
      },
      // Add game timer to Redux state
      gameTime: 0,
      isGameStarted: false,
      // Add move history to Redux state
      gameHistory: [],
    },
    isLoading: false,
    error: null,
    aiDifficulty: 3,
  },
  reducers: {
    setCurrentGame: (state, action) => {
      state.currentGame = { ...state.currentGame, ...action.payload };
    },
    clearCurrentGame: (state) => {
      state.currentGame = {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: [],
        isPlayerTurn: true,
        gameStatus: "playing",
        result: null,
        isAIThinking: false,
        capturedPieces: {
          white: [],
          black: [],
        },
        gameTime: 0,
        isGameStarted: false,
        gameHistory: [],
      };
      state.error = null;
    },
    setAIDifficulty: (state, action) => {
      state.aiDifficulty = action.payload;
    },
    setAIThinking: (state, action) => {
      state.currentGame.isAIThinking = action.payload;
    },
    updateGameState: (state, action) => {
      const { fen, isPlayerTurn, gameStatus, result } = action.payload;
      state.currentGame.fen = fen;
      state.currentGame.isPlayerTurn = isPlayerTurn;
      state.currentGame.gameStatus = gameStatus;
      if (result) state.currentGame.result = result;
    },
    // Add captured piece to Redux state
    addCapturedPiece: (state, action) => {
      const { piece, isPlayerCapture } = action.payload;
      if (piece) {
        const color = isPlayerCapture ? "black" : "white";
        state.currentGame.capturedPieces[color].push(piece);
      }
    },
    // Update game timer in Redux state
    updateGameTime: (state, action) => {
      state.currentGame.gameTime = action.payload;
    },
    // Set game started status
    setGameStarted: (state, action) => {
      state.currentGame.isGameStarted = action.payload;
    },
    // Add move to history
    addMoveToHistory: (state, action) => {
      state.currentGame.gameHistory.push(action.payload);
    },
    // Resign game action
    resignGame: (state) => {
      state.currentGame.gameStatus = "ended";
      state.currentGame.result = "loss";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch game history
      .addCase(fetchGameHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGameHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload.games;
      })
      .addCase(fetchGameHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Make move
      .addCase(makeMove.pending, (state) => {
        state.error = null;
      })
      .addCase(makeMove.fulfilled, (state, action) => {
        const { fen, isPlayerTurn, gameStatus, result, capturedPiece } =
          action.payload;
        state.currentGame.fen = fen;
        state.currentGame.isPlayerTurn = isPlayerTurn;
        state.currentGame.gameStatus = gameStatus;
        if (result) state.currentGame.result = result;

        // Handle captured piece from player move
        if (capturedPiece) {
          state.currentGame.capturedPieces.black.push(capturedPiece);
        }

        // Start game timer if not started
        if (!state.currentGame.isGameStarted) {
          state.currentGame.isGameStarted = true;
        }
      })
      .addCase(makeMove.rejected, (state, action) => {
        state.error = action.payload;
      })
      // AI move
      .addCase(getAIMove.pending, (state) => {
        state.currentGame.isAIThinking = true;
        state.error = null;
      })
      .addCase(getAIMove.fulfilled, (state, action) => {
        const { fen, isPlayerTurn, gameStatus, result, capturedPiece } =
          action.payload;
        state.currentGame.fen = fen;
        state.currentGame.isPlayerTurn = isPlayerTurn;
        state.currentGame.gameStatus = gameStatus;
        state.currentGame.isAIThinking = false;
        if (result) state.currentGame.result = result;

        // Handle captured piece from AI move
        if (capturedPiece) {
          state.currentGame.capturedPieces.white.push(capturedPiece);
        }
      })
      .addCase(getAIMove.rejected, (state, action) => {
        state.currentGame.isAIThinking = false;
        state.error = action.payload;
      })
      // Save game result
      .addCase(saveGameResult.fulfilled, (state, action) => {
        // Game result saved successfully
      });
  },
});

export const {
  setCurrentGame,
  clearCurrentGame,
  setAIDifficulty,
  setAIThinking,
  updateGameState,
  addCapturedPiece,
  updateGameTime,
  setGameStarted,
  addMoveToHistory,
  resignGame,
} = gameSlice.actions;

export default gameSlice.reducer;
