import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import profileSlice from "./slices/profileSlice";
import gameSlice from "./slices/gameSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    game: gameSlice,
  },
});
