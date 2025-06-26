import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "https://oops-checkmate-web.onrender.com/api";

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

export const updateGameStats = createAsyncThunk(
  "profile/updateGameStats",
  async (gameResult, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/update-game-stats`,
        gameResult,
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

// New thunks for enhanced features
export const uploadProfilePhoto = createAsyncThunk(
  "profile/uploadProfilePhoto",
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/upload-profile-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

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

export const fetchFollowers = createAsyncThunk(
  "profile/fetchFollowers",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/followers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

export const followUser = createAsyncThunk(
  "profile/followUser",
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/follow/${userId}`,
        {},
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

// Missing unfollowUser thunk
export const unfollowUser = createAsyncThunk(
  "profile/unfollowUser",
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${API_BASE_URL}/unfollow/${userId}`,
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
    followers: [],
    suggestions: [],
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
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = { ...state.data, ...action.payload.profile };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Game Stats
      .addCase(updateGameStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
        if (action.payload.achievements) {
          state.achievements = action.payload.achievements;
        }
      })
      // Upload Profile Photo
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        if (state.data) {
          state.data.profilePhoto = action.payload.profilePhoto;
        }
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Friends
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload.friends || [];
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Followers
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload.followers || [];
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Suggestions
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload.suggestions || [];
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Follow User
      .addCase(followUser.fulfilled, (state, action) => {
        // Update friends list after following
        if (action.payload.friend) {
          state.friends.push(action.payload.friend);
          // Remove from suggestions
          state.suggestions = state.suggestions.filter(
            (s) => s.id !== action.payload.friend.id
          );
        }
      })
      .addCase(followUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Unfollow User
      .addCase(unfollowUser.fulfilled, (state, action) => {
        // Remove from friends list after unfollowing
        if (action.payload.userId) {
          state.friends = state.friends.filter(
            (friend) => friend.id !== action.payload.userId
          );
        }
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Subscribe Newsletter
      .addCase(subscribeNewsletter.fulfilled, (state, action) => {
        // Update newsletter subscription status
        const newsletter = state.newsletters.find(
          (n) => n.id === action.payload.newsletterId
        );
        if (newsletter) {
          newsletter.subscribed = action.payload.subscribed;
        }
      })
      .addCase(subscribeNewsletter.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { updatePreferences, clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
