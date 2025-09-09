import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {queue: string[]} = {
    queue: []
};

const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    show: (state, action: PayloadAction<string|undefined>) => {
      state.queue.push(action.payload || "Loading");
    },
    hide: (state, action: PayloadAction) => {
      state.queue = state.queue.slice(1);
    },
  },
});

export const showLoader = loaderSlice.actions.show;
export const hideLoader = loaderSlice.actions.hide;
export default loaderSlice.reducer;
