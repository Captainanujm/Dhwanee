import { combineReducers, configureStore } from "@reduxjs/toolkit";
import localforage from "localforage";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import loaderReducer from "src/components/loader/reducer";
import snackbarReducer from "src/components/snackbar/reducer";
import authReducer from "./auth-reducer";

const persistConfig = {
  key: "dhwanee-shnerp-root",
  storage: localforage,
  blacklist: ["loader", "snackbar"],
};
const persistedReducer = persistReducer(persistConfig, combineReducers({
    loader: loaderReducer,
    snackbar: snackbarReducer,
    auth: authReducer,
}));

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
      //@ts-expect-erro
      // enhancers: window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
