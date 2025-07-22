import React, { useState, useEffect, useRef } from "react";
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
  Camera,
  Users,
  UserPlus,
  Mail,
  Search,
  Filter,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  Bell,
  BellOff,
  Award,
  Target,
  Zap,
  Star,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Shield,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Check,
  XIcon,
  Send,
  UserMinus,
  UserCheck,
  Clock as ClockIcon,
  AlertCircle,
  Phone,
  Video,
} from "lucide-react";
import Cropper from "react-easy-crop";
import {
  fetchProfile,
  updateProfile,
  uploadProfilePhoto,
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  fetchSuggestions,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsers,
  clearSearchResults,
  fetchNewsletters,
  subscribeNewsletter,
  updatePreferences,
} from "../../store/slices/profileSlice";
import ChatModal from "../ChatModal/ChatModal"; // Import the ChatModal component

// Profile Image Cropper Component
const ProfileImageCropper = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = () => {
    onCropComplete(croppedAreaPixels);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-white">
          Crop Profile Photo
        </h3>

        <div className="relative h-64 mb-4">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200"
          >
            Save & Upload
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Friend Request Modal
const FriendRequestModal = ({ isOpen, onClose, onSend, recipientName }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(message);
    setMessage("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-white">
          Send Friend Request to {recipientName}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
              rows="3"
              placeholder="Hi! I'd like to add you as a friend..."
              maxLength={200}
            />
            <div className="text-xs text-gray-400 mt-1">
              {message.length}/200 characters
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Send Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-white">Change Password</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white pr-10"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.current ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white pr-10"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white pr-10"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.confirm ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200"
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Account Modal
const DeleteAccountModal = ({ isOpen, onClose, onConfirm, authProvider }) => {
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirmation.toLowerCase() !== "delete my account") {
      alert('Please type "delete my account" to confirm');
      return;
    }
    onConfirm({ confirmation, password });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-red-400">Delete Account</h3>

        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">
            ⚠️ This action cannot be undone. All your data will be permanently
            deleted.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Type "delete my account" to confirm:
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              placeholder="delete my account"
              required
            />
          </div>

          {authProvider === "email" && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Enter your password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition duration-200"
            >
              Delete Account
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    data: profile,
    stats,
    achievements,
    preferences,
    friends,
    incomingRequests,
    outgoingRequests,
    suggestions,
    searchResults,
    newsletters,
    isLoading,
    error,
  } = useSelector((state) => state.profile);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendsFilter, setFriendsFilter] = useState("all");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Chat functionality state
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatFriend, setSelectedChatFriend] = useState(null);

  const fileInputRef = useRef(null);

  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    country: "",
    favoriteOpening: "",
    website: "",
    location: "",
  });

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchFriends());
    dispatch(fetchIncomingRequests());
    dispatch(fetchOutgoingRequests());
    dispatch(fetchSuggestions());
    dispatch(fetchNewsletters());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        bio: profile.bio || "",
        country: profile.country || "",
        favoriteOpening: profile.favoriteOpening || "",
        website: profile.website || "",
        location: profile.location || "",
      });
    }
  }, [profile]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        dispatch(searchUsers(searchQuery));
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchQuery, dispatch]);

  // Chat functionality handlers
  const handleOpenChat = (friend) => {
    setSelectedChatFriend(friend);
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
    setSelectedChatFriend(null);
  };

  const handleSaveProfile = () => {
    dispatch(updateProfile(editForm));
    setIsEditing(false);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setShowImageCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const image = new Image();

      image.onload = async () => {
        canvas.width = 200;
        canvas.height = 200;

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          200,
          200
        );

        const croppedImageData = canvas.toDataURL("image/jpeg", 0.8);

        dispatch(
          uploadProfilePhoto({
            imageData: croppedImageData,
            cropData: croppedAreaPixels,
          })
        );

        setShowImageCropper(false);
        setSelectedImage(null);
      };

      image.src = selectedImage;
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const handleSendFriendRequest = (userId, recipientName) => {
    setSelectedRecipient({ id: userId, name: recipientName });
    setShowFriendRequestModal(true);
  };

  const handleConfirmSendRequest = (message) => {
    if (selectedRecipient) {
      dispatch(
        sendFriendRequest({
          userId: selectedRecipient.id,
          message,
        })
      );
      setShowFriendRequestModal(false);
      setSelectedRecipient(null);
    }
  };

  const handleAcceptRequest = (requestId) => {
    dispatch(acceptFriendRequest(requestId)).then(() => {
      dispatch(fetchFriends());
      dispatch(fetchIncomingRequests());
    });
  };

  const handleDeclineRequest = (requestId) => {
    dispatch(declineFriendRequest(requestId));
  };

  const handleCancelRequest = (requestId) => {
    dispatch(cancelFriendRequest(requestId));
  };

  const handleRemoveFriend = (friendId) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      dispatch(removeFriend(friendId));
    }
  };

  const handlePreferenceChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    dispatch(updatePreferences(newPreferences));
  };

  const handleNewsletterSubscribe = (newsletterId) => {
    dispatch(subscribeNewsletter(newsletterId));
  };

  const handleChangePassword = async (passwordData) => {
    try {
      const response = await fetch(
        "https://oops-checkmate-web.onrender.com/api/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(passwordData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert("Password changed successfully");
        setShowChangePassword(false);
      } else {
        alert(result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(
        "https://oops-checkmate-web.onrender.com/api/export-game-data",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chess_data_${user.name}_${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const result = await response.json();
        alert(result.error || "Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    }
  };

  const handleDeleteAccount = async (confirmationData) => {
    try {
      const response = await fetch("https://oops-checkmate-web.onrender.com/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(confirmationData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Account deleted successfully");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(result.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account");
    }
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

  const filteredFriends =
    friends?.filter((friend) => {
      const matchesSearch = friend.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        friendsFilter === "all" || friend.status === friendsFilter;
      return matchesSearch && matchesFilter;
    }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
      {/* Mobile-First Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <h1 className="text-lg sm:text-2xl font-bold truncate">
              Player Profile
            </h1>
            <button
              onClick={() => window.history.back()}
              className="px-3 py-2 sm:px-4 bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-200 text-sm sm:text-base"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile-Responsive Profile Header */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Profile Photo with Upload */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-black overflow-hidden">
                {profile?.profilePhoto ? (
                  <img
                    src={
                      profile.profilePhoto.startsWith("data:")
                        ? profile.profilePhoto
                        : `https://oops-checkmate-web.onrender.com/api${profile.profilePhoto}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`${
                    profile?.profilePhoto ? "hidden" : "flex"
                  } w-full h-full items-center justify-center`}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition duration-200 group"
                title="Change profile photo"
              >
                <Camera size={12} className="sm:w-4 sm:h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left w-full">
              {isEditing ? (
                <div className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="text-xl sm:text-2xl font-bold bg-white/10 rounded-lg px-3 py-2 w-full"
                    placeholder="Your name"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    className="w-full bg-white/10 rounded-lg px-3 py-2 resize-none text-sm sm:text-base"
                    rows="2"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) =>
                        setEditForm({ ...editForm, country: e.target.value })
                      }
                      className="bg-white/10 rounded-lg px-3 py-2 text-sm sm:text-base"
                      placeholder="Country"
                    />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      className="bg-white/10 rounded-lg px-3 py-2 text-sm sm:text-base"
                      placeholder="City"
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
                      className="bg-white/10 rounded-lg px-3 py-2 text-sm sm:text-base"
                      placeholder="Favorite Opening"
                    />
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm({ ...editForm, website: e.target.value })
                      }
                      className="bg-white/10 rounded-lg px-3 py-2 text-sm sm:text-base"
                      placeholder="Website"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center gap-2 transition duration-200 text-sm sm:text-base"
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition duration-200 text-sm sm:text-base"
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-bold">
                      {profile?.name || user?.name}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-white/10 rounded-lg transition duration-200"
                    >
                      <Edit3 size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <Crown className={getRatingColor(stats.rating)} size={18} />
                    <span
                      className={`text-base sm:text-lg font-semibold ${getRatingColor(
                        stats.rating
                      )}`}
                    >
                      {getRatingTitle(stats.rating)} ({stats.rating})
                    </span>
                  </div>

                  {profile?.bio && (
                    <p className="text-gray-300 mt-3 max-w-md text-sm sm:text-base">
                      {profile.bio}
                    </p>
                  )}

                  {/* Social Stats */}
                  <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 mt-4 text-sm sm:text-base">
                    <div className="text-center">
                      <div className="font-bold text-lg sm:text-xl">
                        {friends?.length || 0}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Friends
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg sm:text-xl">
                        {incomingRequests?.length || 0}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Requests
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg sm:text-xl">
                        {stats.gamesPlayed}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Games
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 justify-center sm:justify-start text-xs sm:text-sm text-gray-300">
                    {profile?.country && (
                      <span className="flex items-center gap-1">
                        🌍 {profile.country}
                      </span>
                    )}
                    {profile?.location && (
                      <span className="flex items-center gap-1">
                        📍 {profile.location}
                      </span>
                    )}
                    {profile?.favoriteOpening && (
                      <span className="flex items-center gap-1">
                        ♟️ {profile.favoriteOpening}
                      </span>
                    )}
                    {profile?.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-400"
                      >
                        🔗 Website
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
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

        {/* Mobile-Responsive Tab Navigation */}
        <div className="flex overflow-x-auto bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-1 sm:p-2 mb-4 sm:mb-8 scrollbar-hide">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "stats", label: "Stats", icon: TrendingUp },
            { id: "friends", label: "Friends", icon: Users },
            { id: "achievements", label: "Achievements", icon: Trophy },
            { id: "newsletters", label: "Newsletters", icon: Mail },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium transition duration-200 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === tab.id
                  ? "bg-white text-purple-600"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <tab.icon size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Enhanced Quick Stats */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">Games Played</span>
                  <span className="font-bold text-sm sm:text-base">
                    {stats.gamesPlayed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">Win Rate</span>
                  <span className="font-bold text-green-400 text-sm sm:text-base">
                    {calculateWinRate()}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">Current Rating</span>
                  <span
                    className={`font-bold ${getRatingColor(
                      stats.rating
                    )} text-sm sm:text-base`}
                  >
                    {stats.rating}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">Highest Rating</span>
                  <span className="font-bold text-yellow-400 text-sm sm:text-base">
                    {stats.highestRating || stats.rating}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">
                    Average Game Time
                  </span>
                  <span className="font-bold text-blue-400 text-sm sm:text-base">
                    12m 34s
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3 text-gray-300 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Won against AI (Expert)</span>
                  <span className="text-xs text-gray-400 ml-auto">2h ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Achievement unlocked: Rising Star</span>
                  <span className="text-xs text-gray-400 ml-auto">1d ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Rating increased by +25</span>
                  <span className="text-xs text-gray-400 ml-auto">2d ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>New friend: ChessMaster2024</span>
                  <span className="text-xs text-gray-400 ml-auto">3d ago</span>
                </div>
              </div>
            </div>

            {/* Chess Performance */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4">Performance</h3>
              <div className="space-y-3 text-gray-300 text-sm sm:text-base">
                <div className="flex justify-between items-center">
                  <span>Favorite Opening</span>
                  <span className="font-medium">
                    {profile?.favoriteOpening || "Sicilian Defense"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Best Time Control</span>
                  <span className="font-medium">Blitz (5+0)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Playing Style</span>
                  <span className="font-medium">Aggressive</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accuracy</span>
                  <span className="font-medium text-green-400">87.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Puzzle Rating</span>
                  <span className="font-medium text-blue-400">1456</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Game Statistics */}
              <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Game Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base">Total Games</span>
                    <span className="font-bold text-lg">
                      {stats.gamesPlayed}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-400">Wins</span>
                      <span className="font-bold">{stats.wins}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-400 h-2 rounded-full"
                        style={{
                          width: `${
                            stats.gamesPlayed > 0
                              ? (stats.wins / stats.gamesPlayed) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-400">Losses</span>
                      <span className="font-bold">{stats.losses}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{
                          width: `${
                            stats.gamesPlayed > 0
                              ? (stats.losses / stats.gamesPlayed) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-yellow-400">Draws</span>
                      <span className="font-bold">{stats.draws}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${
                            stats.gamesPlayed > 0
                              ? (stats.draws / stats.gamesPlayed) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Progress */}
              <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Rating Progress
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${getRatingColor(
                        stats.rating
                      )}`}
                    >
                      {stats.rating}
                    </div>
                    <div className="text-gray-400">Current Rating</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-bold text-yellow-400">
                        {stats.highestRating || stats.rating}
                      </div>
                      <div className="text-gray-400">Peak</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-400">+25</div>
                      <div className="text-gray-400">Last Game</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-400">87.3%</div>
                      <div className="text-gray-400">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Activity size={20} />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Clock className="mx-auto mb-2 text-blue-400" size={24} />
                  <div className="font-bold">12m 34s</div>
                  <div className="text-xs text-gray-400">Avg Game Time</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Target className="mx-auto mb-2 text-green-400" size={24} />
                  <div className="font-bold">87.3%</div>
                  <div className="text-xs text-gray-400">Accuracy</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Zap className="mx-auto mb-2 text-yellow-400" size={24} />
                  <div className="font-bold">1456</div>
                  <div className="text-xs text-gray-400">Puzzle Rating</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Star className="mx-auto mb-2 text-purple-400" size={24} />
                  <div className="font-bold">42</div>
                  <div className="text-xs text-gray-400">Brilliant Moves</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "friends" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Search and Filter */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search friends or users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm sm:text-base"
                  />
                </div>
                <select
                  value={friendsFilter}
                  onChange={(e) => setFriendsFilter(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base"
                >
                  <option value="all">All Friends</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && searchResults.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold mb-3">Search Results</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white/5 rounded-lg p-3 sm:p-4 hover:bg-white/10 transition duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden">
                            {user.profilePhoto ? (
                              <img
                                src={
                                  user.profilePhoto.startsWith("data:")
                                    ? user.profilePhoto
                                    : `https://oops-checkmate-web.onrender.com/api${user.profilePhoto}`
                                }
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-sm sm:text-base">
                              {user.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              Rating: {user.rating}
                            </p>
                          </div>
                          <div className="flex gap-1 sm:gap-2">
                            {user.relationshipStatus === "none" && (
                              <button
                                onClick={() =>
                                  handleSendFriendRequest(user.id, user.name)
                                }
                                className="p-1 sm:p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200"
                              >
                                <UserPlus size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            )}
                            {user.relationshipStatus === "request_sent" && (
                              <span className="p-1 sm:p-2 bg-yellow-500 rounded-lg text-xs">
                                Sent
                              </span>
                            )}
                            {user.relationshipStatus === "friends" && (
                              <span className="p-1 sm:p-2 bg-green-500 rounded-lg text-xs">
                                Friends
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Friend Requests */}
              {incomingRequests && incomingRequests.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold mb-3">Friend Requests</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {incomingRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="bg-white/5 rounded-lg p-3 sm:p-4 hover:bg-white/10 transition duration-200"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden">
                            {request.profilePhoto ? (
                              <img
                                src={
                                  request.profilePhoto.startsWith("data:")
                                    ? request.profilePhoto
                                    : `https://oops-checkmate-web.onrender.com/api${request.profilePhoto}`
                                }
                                alt={request.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              request.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-sm sm:text-base">
                              {request.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              Rating: {request.rating}
                            </p>
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-xs text-gray-300 mb-3 italic">
                            "{request.message}"
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAcceptRequest(request.requestId)
                            }
                            className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg transition duration-200 text-xs flex items-center justify-center gap-1"
                          >
                            <Check size={12} />
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleDeclineRequest(request.requestId)
                            }
                            className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg transition duration-200 text-xs flex items-center justify-center gap-1"
                          >
                            <X size={12} />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List with Chat Integration */}
              <div className="mb-6">
                <h4 className="text-lg font-bold mb-3">
                  Friends ({filteredFriends.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="bg-white/5 rounded-lg p-3 sm:p-4 hover:bg-white/10 transition duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden">
                              {friend.profilePhoto ? (
                                <img
                                  src={
                                    friend.profilePhoto.startsWith("data:")
                                      ? friend.profilePhoto
                                      : `https://oops-checkmate-web.onrender.com/api${friend.profilePhoto}`
                                  }
                                  alt={friend.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                friend.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-gray-800 ${
                                friend.status === "online"
                                  ? "bg-green-400"
                                  : friend.status === "playing"
                                  ? "bg-yellow-400"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-sm sm:text-base">
                              {friend.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              Rating: {friend.rating}
                            </p>
                            <p className="text-xs text-gray-500">
                              {friend.status === "online"
                                ? "Online now"
                                : friend.status === "playing"
                                ? "In game"
                                : `Last seen ${new Date(
                                    friend.lastSeen
                                  ).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 sm:gap-2">
                            <button
                              onClick={() => handleOpenChat(friend)}
                              className="p-1 sm:p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200 group"
                              title="Send message"
                            >
                              <MessageCircle
                                size={14}
                                className="sm:w-4 sm:h-4 text-white"
                              />
                            </button>
                            <button
                              className="p-1 sm:p-2 bg-green-500 hover:bg-green-600 rounded-lg transition duration-200 group"
                              title="Challenge to game"
                            >
                              <Trophy
                                size={14}
                                className="sm:w-4 sm:h-4 text-white"
                              />
                            </button>
                            <button
                              onClick={() => handleRemoveFriend(friend.id)}
                              className="p-1 sm:p-2 hover:bg-red-500/20 rounded-lg transition duration-200 text-red-400 group"
                              title="Remove friend"
                            >
                              <UserMinus size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No friends found</p>
                      <p className="text-sm">
                        Start adding friends to see them here!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Friend Suggestions */}
              <div>
                <h4 className="text-lg font-bold mb-3">Suggested Friends</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {suggestions?.slice(0, 6).map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="bg-white/5 rounded-lg p-3 sm:p-4 text-center"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2 sm:mb-3 text-sm sm:text-lg overflow-hidden">
                        {suggestion.profilePhoto ? (
                          <img
                            src={
                              suggestion.profilePhoto.startsWith("data:")
                                ? suggestion.profilePhoto
                                : `https://oops-checkmate-web.onrender.com/api${suggestion.profilePhoto}`
                            }
                            alt={suggestion.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          suggestion.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <h4 className="font-medium mb-1 text-sm sm:text-base truncate">
                        {suggestion.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                        Rating: {suggestion.rating}
                      </p>
                      <p className="text-xs text-gray-500 mb-2 sm:mb-3">
                        {suggestion.mutualFriends} mutual friends
                      </p>
                      <button
                        onClick={() =>
                          handleSendFriendRequest(
                            suggestion.id,
                            suggestion.name
                          )
                        }
                        className="w-full px-3 py-1 sm:py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200 text-xs sm:text-sm font-medium"
                      >
                        <UserPlus
                          size={12}
                          className="inline mr-1 sm:w-4 sm:h-4"
                        />{" "}
                        Add Friend
                      </button>
                    </div>
                  )) || (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      No friend suggestions available at the moment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
              Achievements & Badges
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {achievements && achievements.length > 0
                ? achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="p-4 sm:p-6 rounded-lg border-2 transition duration-200 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/50"
                    >
                      <div className="text-center">
                        <div className="text-4xl sm:text-5xl mb-3">
                          {achievement.icon}
                        </div>
                        <h4 className="font-bold text-base sm:text-lg mb-2">
                          {achievement.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-400 mb-3">
                          {achievement.description}
                        </p>
                        <div className="text-xs text-yellow-400">
                          Earned on{" "}
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                : [
                    {
                      name: "First Victory",
                      description: "Win your first game",
                      icon: "🏆",
                      earned: true,
                      rarity: "common",
                      earnedDate: "2024-01-15",
                    },
                    {
                      name: "Rising Star",
                      description: "Reach 1200 rating",
                      icon: "⭐",
                      earned: true,
                      rarity: "uncommon",
                      earnedDate: "2024-02-20",
                    },
                    {
                      name: "Chess Master",
                      description: "Reach 2000 rating",
                      icon: "👑",
                      earned: false,
                      rarity: "rare",
                      progress: 60,
                    },
                    {
                      name: "Puzzle Solver",
                      description: "Solve 100 puzzles",
                      icon: "🧩",
                      earned: true,
                      rarity: "common",
                      earnedDate: "2024-03-10",
                    },
                    {
                      name: "Speed Demon",
                      description: "Win 10 blitz games in a row",
                      icon: "⚡",
                      earned: false,
                      rarity: "epic",
                      progress: 30,
                    },
                    {
                      name: "Social Player",
                      description: "Add 25 friends",
                      icon: "👥",
                      earned: false,
                      rarity: "uncommon",
                      progress: 80,
                    },
                  ].map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 sm:p-6 rounded-lg border-2 transition duration-200 ${
                        achievement.earned
                          ? "bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/50"
                          : "bg-white/5 border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl sm:text-5xl mb-3">
                          {achievement.icon}
                        </div>
                        <h4 className="font-bold text-base sm:text-lg mb-2">
                          {achievement.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-400 mb-3">
                          {achievement.description}
                        </p>

                        <div className="flex justify-center mb-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              achievement.rarity === "common"
                                ? "bg-gray-600 text-gray-300"
                                : achievement.rarity === "uncommon"
                                ? "bg-green-600 text-green-300"
                                : achievement.rarity === "rare"
                                ? "bg-blue-600 text-blue-300"
                                : "bg-purple-600 text-purple-300"
                            }`}
                          >
                            {achievement.rarity.toUpperCase()}
                          </span>
                        </div>

                        {achievement.earned ? (
                          <div className="text-xs text-yellow-400">
                            Earned on{" "}
                            {new Date(
                              achievement.earnedDate
                            ).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${achievement.progress || 0}%`,
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {achievement.progress || 0}% Complete
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {activeTab === "newsletters" && (
          <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
              Chess Newsletters
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {newsletters && newsletters.length > 0
                ? newsletters.map((newsletter) => (
                    <div
                      key={newsletter.id}
                      className="bg-white/5 rounded-lg p-4 sm:p-6 hover:bg-white/10 transition duration-200"
                    >
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">
                            {newsletter.name}
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3">
                            {newsletter.description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                            <span className="bg-white/10 px-2 py-1 rounded">
                              {newsletter.frequency}
                            </span>
                            <span className="bg-white/10 px-2 py-1 rounded">
                              {newsletter.category}
                            </span>
                            <span className="bg-white/10 px-2 py-1 rounded">
                              {newsletter.subscribers} subscribers
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleNewsletterSubscribe(newsletter.id)
                          }
                          className={`ml-3 px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition duration-200 text-xs sm:text-sm font-medium whitespace-nowrap ${
                            newsletter.subscribed
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          {newsletter.subscribed ? (
                            <>
                              <BellOff
                                size={12}
                                className="inline mr-1 sm:w-4 sm:h-4"
                              />
                              Unsubscribe
                            </>
                          ) : (
                            <>
                              <Bell
                                size={12}
                                className="inline mr-1 sm:w-4 sm:h-4"
                              />
                              Subscribe
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                : [
                    {
                      id: 1,
                      name: "Chess Daily",
                      description:
                        "Daily chess puzzles, tips, and news from the chess world",
                      subscribers: "125K",
                      frequency: "Daily",
                      category: "General",
                      subscribed: false,
                    },
                    {
                      id: 2,
                      name: "Opening Mastery",
                      description:
                        "Deep dive into chess openings with grandmaster analysis",
                      subscribers: "89K",
                      frequency: "Weekly",
                      category: "Education",
                      subscribed: true,
                    },
                    {
                      id: 3,
                      name: "Tournament Updates",
                      description:
                        "Latest news from major chess tournaments worldwide",
                      subscribers: "156K",
                      frequency: "Bi-weekly",
                      category: "News",
                      subscribed: false,
                    },
                    {
                      id: 4,
                      name: "Endgame Excellence",
                      description:
                        "Master endgame techniques with expert guidance",
                      subscribers: "67K",
                      frequency: "Weekly",
                      category: "Education",
                      subscribed: true,
                    },
                  ].map((newsletter) => (
                    <div
                      key={newsletter.id}
                      className="bg-white/5 rounded-lg p-4 sm:p-6 hover:bg-white/10 transition duration-200"
                    >
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">
                            {newsletter.name}
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3">
                            {newsletter.description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                            <span className="bg-white/10 px-2 py-1 rounded">
                              {newsletter.frequency}
                            </span>
                            <span className="bg-white/10 px-2 py-1 rounded">
                              {newsletter.category}
                            </span>
                            <span className="bg-white/10 px-2 py-1 rounded">
                              {newsletter.subscribers} subscribers
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleNewsletterSubscribe(newsletter.id)
                          }
                          className={`ml-3 px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition duration-200 text-xs sm:text-sm font-medium whitespace-nowrap ${
                            newsletter.subscribed
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          {newsletter.subscribed ? (
                            <>
                              <BellOff
                                size={12}
                                className="inline mr-1 sm:w-4 sm:h-4"
                              />
                              Unsubscribe
                            </>
                          ) : (
                            <>
                              <Bell
                                size={12}
                                className="inline mr-1 sm:w-4 sm:h-4"
                              />
                              Subscribe
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Game Preferences */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
                Game Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Sound Effects</div>
                    <div className="text-sm text-gray-400">
                      Play sounds during games
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handlePreferenceChange(
                        "soundEnabled",
                        !preferences.soundEnabled
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.soundEnabled ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.soundEnabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Show Coordinates</div>
                    <div className="text-sm text-gray-400">
                      Display board coordinates
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handlePreferenceChange(
                        "showCoordinates",
                        !preferences.showCoordinates
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.showCoordinates
                        ? "bg-blue-600"
                        : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.showCoordinates
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Auto-promote to Queen</div>
                    <div className="text-sm text-gray-400">
                      Automatically promote pawns to queens
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handlePreferenceChange(
                        "autoPromoteToQueen",
                        !preferences.autoPromoteToQueen
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.autoPromoteToQueen
                        ? "bg-blue-600"
                        : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.autoPromoteToQueen
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">Board Theme</div>
                  <select
                    value={preferences.theme}
                    onChange={(e) =>
                      handlePreferenceChange("theme", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="wood">Wood</option>
                    <option value="marble">Marble</option>
                    <option value="neon">Neon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
                Account Settings
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-200 text-left flex items-center gap-2"
                >
                  <Key size={16} />
                  Change Password
                </button>
                <button
                  onClick={handleExportData}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition duration-200 text-left flex items-center gap-2"
                >
                  <Download size={16} />
                  Export Game Data
                </button>
                <button className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition duration-200 text-left flex items-center gap-2">
                  <Shield size={16} />
                  Privacy Settings
                </button>
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition duration-200 text-left flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Game Invites</div>
                    <div className="text-sm text-gray-400">
                      Receive notifications for game invitations
                    </div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Friend Requests</div>
                    <div className="text-sm text-gray-400">
                      Get notified when someone sends a friend request
                    </div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Newsletter Updates</div>
                    <div className="text-sm text-gray-400">
                      Receive updates from subscribed newsletters
                    </div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Modals */}
        {showImageCropper && (
          <ProfileImageCropper
            image={selectedImage}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setShowImageCropper(false);
              setSelectedImage(null);
            }}
          />
        )}

        <FriendRequestModal
          isOpen={showFriendRequestModal}
          onClose={() => setShowFriendRequestModal(false)}
          onSend={handleConfirmSendRequest}
          recipientName={selectedRecipient?.name || ""}
        />

        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onSubmit={handleChangePassword}
        />

        <DeleteAccountModal
          isOpen={showDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
          onConfirm={handleDeleteAccount}
          authProvider={user?.authProvider || "email"}
        />

        {/* Chat Modal Integration */}
        <ChatModal
          isOpen={showChatModal}
          onClose={handleCloseChat}
          friend={selectedChatFriend}
          currentUser={user}
        />
      </div>
    </div>
  );
}
