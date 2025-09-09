import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface snackbarStateType {
  open: boolean;
  text: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  actionButtonText?: string;
  autoCloseTimout?: number;
  action?: () => any;
  onCloseCallback?: () => any;
}

const initialState: snackbarStateType = {
  open: false,
  text: "",
};

export const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    show: (
      state,
      action: PayloadAction<
        | string
        | {
            text: string;
            severity?: 'success' | 'info' | 'warning' | 'error';
            actionButtonText?: string;
            autoCloseTimout?: number;
            action?: () => any;
            onCloseCallback?: () => any;
          }
      >
    ) => {
      if (typeof action.payload === "string")
        return { open: true, text: action.payload };
      return { open: true, ...action.payload };
    },
    hide: () => initialState,
  },
});

export const showSnackbar = snackbarSlice.actions.show;
export const hideSnackbar = snackbarSlice.actions.hide;

export default snackbarSlice.reducer;
