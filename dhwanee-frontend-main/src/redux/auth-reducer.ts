import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface authSliceType {
  tokens?: { refresh: string; access: string };
  body?: {
    user_id: number;
    user_name: string;
    is_superuser: boolean;
    agency: { name: string; id: number };
    branch: { name: string; id: number }[];
  };
  permissions: string[];
}

const initialState: authSliceType = {
  tokens: undefined,
  body: undefined,
  permissions: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ refresh: string; access: string }>
    ) => {
      state.tokens = action.payload;
      state.body = JSON.parse(atob(action.payload.access.split(".")[1]));
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    logout: (state, action: PayloadAction) => {
      state.tokens = undefined;
      state.body = undefined;
      state.permissions = [];
    },
    loadPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
    },
  },
});

export const login = authSlice.actions.login;
export const logout = authSlice.actions.logout;
export const loadPermissions = authSlice.actions.loadPermissions;
export default authSlice.reducer;
