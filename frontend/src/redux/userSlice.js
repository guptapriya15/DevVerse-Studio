import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    authLoading: true,
    authError: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
      state.authError = null;
    },
    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },
    setAuthError: (state, action) => {
      state.authError = action.payload;
    },
  },
});

export const { setUserData, setAuthLoading, setAuthError } = userSlice.actions;

export default userSlice.reducer;
