import { createSlice } from "@reduxjs/toolkit";

let parsedToken = null;
const storedToken = localStorage.getItem("token");
if (storedToken) {
  try {
    parsedToken = JSON.parse(storedToken);
  } catch (error) {
    // If the token was stored as a raw string instead of JSON, we catch the error and use it directly
    console.warn("Token was not JSON, using raw string.", error);
    parsedToken = storedToken;
  }
}

const initialState = {
  signupData: null,
  loading: false,
  token: parsedToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setSignupData(state, value) {
      state.signupData = value.payload;
    },
    setLoading(state, value) {
      state.loading = value.payload;
    },
    setToken(state, value) {
      state.token = value.payload;
    },
  },
});

export const { setSignupData, setLoading, setToken } = authSlice.actions;

export default authSlice.reducer;