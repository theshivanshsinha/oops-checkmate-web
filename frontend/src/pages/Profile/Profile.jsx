import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  User,
  Trophy,
  Settings,
  Calendar,
  TrendingUp,
  Edit3,
  Save,
  X,
  Volume2,
  VolumeX,
  Crown,
} from "lucide-react";
import {
  fetchProfile,
  updateProfile,
  updatePreferences,
} from "../../store/slices/profileSlice";

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    data: profile,
    stats,
    achievements,
    preferences,
    isLoading,
  } = useSelector((state) => state.profile);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    country: "",
    favoriteOpening: "",
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        bio: profile.bio || "",
        country: profile.country || "",
        favoriteOpening: profile.favoriteOpening || "",
      });
    }
  }, [profile]);

  const handleSaveProfile = () => {
    dispatch(updateProfile(editForm));
    setIsEditing(false);
  };

  const handlePreferenceChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    dispatch(updatePreferences(newPreferences));
    // Also update on server
    dispatch(updateProfile({ preferences: newPreferences }));
  };

  const calculateWinRate = () => {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.wins / stats.gamesPlayed) * 100);
  };

  const getRatingColor = (rating) => {
    if (rating >= 2000) return "text-purple-400";
    if (rating >= 1600) return "text-blue-400";
    if (rating >= 1200) return "text-green-400";
    return "text-yellow-400";
  };

  const getRatingTitle = (rating) => {
    if (rating >= 2400) return "Grandmaster";
    if (rating >= 2200) return "International Master";
    if (rating >= 2000) return "FIDE Master";
    if (rating >= 1800) return "Expert";
    if (rating >= 1600) return "Class A";
    if (rating >= 1400) return "Class B";
    if (rating >= 1200) return "Class C";
    return "Beginner";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">Player Profile</h1>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-black/20 backdrop-blur-md rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl font-bold text-black">
              {user?.name?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="text-2xl font-bold bg-white/10 rounded-lg px-3 py-2 w-full md:w-auto"
                    placeholder="Your name"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    className="w-full bg-white/10 rounded-lg px-3 py-2 resize-none"
                    rows="2"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) =>
                        setEditForm({ ...editForm, country: e.target.value })
                      }
                      className="bg-white/10 rounded-lg px-3 py-2 flex-1"
                      placeholder="Country"
                    />
                    <input
                      type="text"
                      value={editForm.favoriteOpening}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          favoriteOpening: e.target.value,
                        })
                      }
                      className="bg-white/10 rounded-lg px-3 py-2 flex-1"
                      placeholder="Favorite Opening"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-2 transition duration-200"
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition duration-200"
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <h2 className="text-3xl font-bold">
                      {profile?.name || user?.name}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-white/10 rounded-lg transition duration-200"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                    <Crown className={getRatingColor(stats.rating)} size={20} />
                    <span
                      className={`text-lg font-semibold ${getRatingColor(
                        stats.rating
                      )}`}
                    >
                      {getRatingTitle(stats.rating)} ({stats.rating})
                    </span>
                  </div>

                  {profile?.bio && (
                    <p className="text-gray-300 mt-3 max-w-md">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start text-sm text-gray-300">
                    {profile?.country && (
                      <span className="flex items-center gap-1">
                        🌍 {profile.country}
                      </span>
                    )}
                    {profile?.favoriteOpening && (
                      <span className="flex items-center gap-1">
                        ♟️ {profile.favoriteOpening}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Joined{" "}
                      {new Date(
                        profile?.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/20 backdrop-blur-md rounded-2xl p-2 mb-8">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "stats", label: "Statistics", icon: TrendingUp },
            { id: "achievements", label: "Achievements", icon: Trophy },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-purple-600"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Games Played</span>
                  <span className="font-bold">{stats.gamesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Rate</span>
                  <span className="font-bold text-green-400">
                    {calculateWinRate()}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Rating</span>
                  <span className={`font-bold ${getRatingColor(stats.rating)}`}>
                    {stats.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              <div className="text-gray-300">
                <p className="mb-2">🎯 Last game: Yesterday</p>
                <p className="mb-2">📈 Rating change: +15</p>
                <p>🏆 New achievement unlocked!</p>
              </div>
            </div>

            {/* Favorite Opening */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Chess Profile</h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  <strong>Playing Style:</strong> Aggressive
                </p>
                <p>
                  <strong>Favorite Piece:</strong> Queen
                </p>
                <p>
                  <strong>Best Time Control:</strong> Blitz
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Game Results */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Game Results</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Wins</span>
                  </div>
                  <span className="font-bold text-green-400">{stats.wins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Losses</span>
                  </div>
                  <span className="font-bold text-red-400">{stats.losses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>Draws</span>
                  </div>
                  <span className="font-bold text-yellow-400">
                    {stats.draws}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Progress */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Rating Progress</h3>
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${getRatingColor(
                    stats.rating
                  )} mb-2`}
                >
                  {stats.rating}
                </div>
                <div className="text-gray-300 mb-4">
                  {getRatingTitle(stats.rating)}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((stats.rating / 2400) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Next:{" "}
                  {stats.rating >= 2400
                    ? "Grandmaster!"
                    : getRatingTitle(stats.rating + 200)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.length > 0
              ? achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-black/20 backdrop-blur-md rounded-2xl p-6 text-center"
                  >
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <h4 className="font-bold mb-2">{achievement.name}</h4>
                    <p className="text-gray-300 text-sm">
                      {achievement.description}
                    </p>
                    <div className="text-xs text-gray-400 mt-2">
                      Earned:{" "}
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              : // Default achievements for new users
                [
                  {
                    icon: "🎯",
                    name: "First Move",
                    description: "Play your first game",
                    locked: true,
                  },
                  {
                    icon: "⚡",
                    name: "Speed Demon",
                    description: "Win a game in under 2 minutes",
                    locked: true,
                  },
                  {
                    icon: "🏆",
                    name: "Victory",
                    description: "Win your first game",
                    locked: true,
                  },
                  {
                    icon: "🔥",
                    name: "Winning Streak",
                    description: "Win 5 games in a row",
                    locked: true,
                  },
                  {
                    icon: "🎖️",
                    name: "Rated Player",
                    description: "Play 10 rated games",
                    locked: true,
                  },
                  {
                    icon: "👑",
                    name: "Chess Master",
                    description: "Reach 2000 rating",
                    locked: true,
                  },
                ].map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-black/20 backdrop-blur-md rounded-2xl p-6 text-center opacity-60"
                  >
                    <div className="text-4xl mb-3 grayscale">
                      {achievement.icon}
                    </div>
                    <h4 className="font-bold mb-2">{achievement.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {achievement.description}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">🔒 Locked</div>
                  </div>
                ))}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Game Preferences */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Game Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Sound Effects</label>
                    <p className="text-sm text-gray-300">
                      Play sounds for moves and captures
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handlePreferenceChange(
                        "soundEnabled",
                        !preferences.soundEnabled
                      )
                    }
                    className={`p-2 rounded-lg transition duration-200 ${
                      preferences.soundEnabled ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    {preferences.soundEnabled ? (
                      <Volume2 size={20} />
                    ) : (
                      <VolumeX size={20} />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Show Coordinates</label>
                    <p className="text-sm text-gray-300">
                      Display board coordinates (a-h, 1-8)
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handlePreferenceChange(
                        "showCoordinates",
                        !preferences.showCoordinates
                      )
                    }
                    className={`px-4 py-2 rounded-lg transition duration-200 ${
                      preferences.showCoordinates
                        ? "bg-green-500"
                        : "bg-gray-600"
                    }`}
                  >
                    {preferences.showCoordinates ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Auto-promote to Queen</label>
                    <p className="text-sm text-gray-300">
                      Automatically promote pawns to Queen
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handlePreferenceChange(
                        "autoPromoteToQueen",
                        !preferences.autoPromoteToQueen
                      )
                    }
                    className={`px-4 py-2 rounded-lg transition duration-200 ${
                      preferences.autoPromoteToQueen
                        ? "bg-green-500"
                        : "bg-gray-600"
                    }`}
                  >
                    {preferences.autoPromoteToQueen ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Board Theme</label>
                    <p className="text-sm text-gray-300">
                      Choose your preferred board style
                    </p>
                  </div>
                  <select
                    value={preferences.theme}
                    onChange={(e) =>
                      handlePreferenceChange("theme", e.target.value)
                    }
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="dark">Dark</option>
                    <option value="wood">Wood</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Account Settings</h3>
              <div className="space-y-4">
                <button className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200 text-left">
                  Change Password
                </button>
                <button className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 rounded-lg transition duration-200 text-left">
                  Export Game Data
                </button>
                <button className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition duration-200 text-left">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
