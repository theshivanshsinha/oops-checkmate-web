import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

// Existing thunks
export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/update-profile`,
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

// Enhanced Friends System Thunks
export const fetchFriends = createAsyncThunk(
  "profile/fetchFriends",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const fetchIncomingRequests = createAsyncThunk(
  "profile/fetchIncomingRequests",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/friend-requests/incoming`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const fetchOutgoingRequests = createAsyncThunk(
  "profile/fetchOutgoingRequests",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/friend-requests/outgoing`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  "profile/fetchSuggestions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/friend-suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  "profile/sendFriendRequest",
  async ({ userId, message }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/send-friend-request`,
        { userId, message },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { ...response.data, userId };
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  "profile/acceptFriendRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/accept-friend-request`,
        { requestId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { ...response.data, requestId };
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const declineFriendRequest = createAsyncThunk(
  "profile/declineFriendRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/decline-friend-request`,
        { requestId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { ...response.data, requestId };
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const cancelFriendRequest = createAsyncThunk(
  "profile/cancelFriendRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/cancel-friend-request`,
        { requestId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { ...response.data, requestId };
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const removeFriend = createAsyncThunk(
  "profile/removeFriend",
  async (friendId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/remove-friend`,
        { friendId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { ...response.data, friendId };
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const searchUsers = createAsyncThunk(
  "profile/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/search-users?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const uploadProfilePhoto = createAsyncThunk(
  "profile/uploadProfilePhoto",
  async (imageData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/upload-profile-photo`,
        imageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    data: null,
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rating: 1200,
      winRate: 0,
      highestRating: 1200,
      averageGameTime: 0,
      accuracy: 0,
      puzzleRating: 1200,
    },
    achievements: [],
    preferences: {
      theme: "classic",
      soundEnabled: true,
      showCoordinates: true,
      autoPromoteToQueen: false,
    },
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    suggestions: [],
    searchResults: [],
    newsletters: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearProfileError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.profile;
        state.stats = action.payload.profile.stats || state.stats;
        state.achievements = action.payload.profile.achievements || [];
        state.preferences =
          action.payload.profile.preferences || state.preferences;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.data = { ...state.data, ...action.payload.profile };
      })

      // Upload Profile Photo
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        if (state.data) {
          state.data.profilePhoto = action.payload.profilePhoto;
        }
      })

      // Fetch Friends
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload.friends || [];
      })

      // Fetch Incoming Requests
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.incomingRequests = action.payload.requests || [];
      })

      // Fetch Outgoing Requests
      .addCase(fetchOutgoingRequests.fulfilled, (state, action) => {
        state.outgoingRequests = action.payload.requests || [];
      })

      // Fetch Suggestions
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload.suggestions || [];
      })

      // Send Friend Request
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.suggestions = state.suggestions.filter(
          (s) => s.id !== action.payload.userId
        );
        state.searchResults = state.searchResults.map((user) =>
          user.id === action.payload.userId
            ? { ...user, relationshipStatus: "request_sent" }
            : user
        );
      })

      // Accept Friend Request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.incomingRequests = state.incomingRequests.filter(
          (req) => req.requestId !== action.payload.requestId
        );
      })

      // Decline Friend Request
      .addCase(declineFriendRequest.fulfilled, (state, action) => {
        state.incomingRequests = state.incomingRequests.filter(
          (req) => req.requestId !== action.payload.requestId
        );
      })

      // Cancel Friend Request
      .addCase(cancelFriendRequest.fulfilled, (state, action) => {
        state.outgoingRequests = state.outgoingRequests.filter(
          (req) => req.requestId !== action.payload.requestId
        );
      })

      // Remove Friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(
          (friend) => friend.id !== action.payload.friendId
        );
      })

      // Search Users
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchResults = action.payload.users || [];
      })

      // Fetch Newsletters
      .addCase(fetchNewsletters.fulfilled, (state, action) => {
        state.newsletters = action.payload.newsletters || [];
      })

      // Subscribe Newsletter
      .addCase(subscribeNewsletter.fulfilled, (state, action) => {
        const newsletter = state.newsletters.find(
          (n) => n.id === action.payload.newsletterId
        );
        if (newsletter) {
          newsletter.subscribed = action.payload.subscribed;
        }
      })

      // Error handling
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.payload;
          state.isLoading = false;
        }
      );
  },
});
export const fetchNewsletters = createAsyncThunk(
  "profile/fetchNewsletters",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/newsletters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const subscribeNewsletter = createAsyncThunk(
  "profile/subscribeNewsletter",
  async (newsletterId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/subscribe-newsletter`,
        { newsletterId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const { updatePreferences, clearProfileError, clearSearchResults } =
  profileSlice.actions;
export default profileSlice.reducer;
