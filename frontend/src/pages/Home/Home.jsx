import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { verifyToken, logout } from "../../store/slices/authSlice";
import { fetchProfile } from "../../store/slices/profileSlice";

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useSelector((state) => state.auth);
  const { stats, isLoading: profileLoading } = useSelector(
    (state) => state.profile
  );

  useEffect(() => {
    // Check authentication status
    dispatch(verifyToken()).then((result) => {
      if (result.type === "auth/verifyToken/fulfilled") {
        // User is authenticated, fetch profile
        dispatch(fetchProfile());
      } else {
        // User is not authenticated, redirect to login
        navigate("/login");
      }
    });
  }, [dispatch, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleViewProfile = () => {
    navigate("/profile");
  };

  const handleMultiplayerGame = () => {
    alert(
      "Multiplayer Coming Soon! We're working hard to bring you the best multiplayer experience."
    );
  };

  const handleAIGame = () => {
    navigate("/game/ai");
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Oops, Checkmate!</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm opacity-90">
                Welcome, {user?.name || "Player"}!
              </span>
              <button
                onClick={handleViewProfile}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition duration-200"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="bg-black/20 backdrop-blur-md rounded-3xl shadow-2xl p-12">
            <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Ready to Play?
            </h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              Challenge friends online or test your skills against our
              intelligent AI. Master the art of chess in the most engaging way
              possible!
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition duration-300">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-2xl font-bold mb-3">Multiplayer</h3>
                <p className="text-gray-200 mb-6">
                  Play against friends and players from around the world in
                  real-time matches.
                </p>
                <button
                  onClick={handleMultiplayerGame}
                  className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold text-lg transition duration-200 transform hover:scale-105"
                >
                  Play Online
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition duration-300">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-2xl font-bold mb-3">Play vs AI</h3>
                <p className="text-gray-200 mb-6">
                  Challenge our intelligent AI with multiple difficulty levels
                  to improve your game.
                </p>
                <button
                  onClick={handleAIGame}
                  className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold text-lg transition duration-200 transform hover:scale-105"
                >
                  Challenge AI
                </button>
              </div>
            </div>

            {/* Player Stats */}
            {stats && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
                <h3 className="text-2xl font-bold mb-4">Your Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {stats.wins || 0}
                    </div>
                    <div className="text-sm opacity-75">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">
                      {stats.losses || 0}
                    </div>
                    <div className="text-sm opacity-75">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">
                      {stats.draws || 0}
                    </div>
                    <div className="text-sm opacity-75">Draws</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {stats.rating || 1200}
                    </div>
                    <div className="text-sm opacity-75">Rating</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/leaderboard")}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl font-semibold transition duration-200"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => navigate("/history")}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-semibold transition duration-200"
              >
                📊 Game History
              </button>
              <button
                onClick={() => navigate("/learn")}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl font-semibold transition duration-200"
              >
                📚 Learn Chess
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm opacity-75">
            © 2025 Oops, Checkmate! - Master the game, one move at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
