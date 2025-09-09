import AUTH_ENDPOINTS from "./endpoints";
import { postToApi } from "src/api";

export const login = (
  username: string,
  password: string
): Promise<{ refresh: string; access: string }> => {
  return postToApi(AUTH_ENDPOINTS.login, "", { username, password })
};

export const refresh = (
  token: string,
): Promise<{ refresh: string; access: string }> => {
  return postToApi(AUTH_ENDPOINTS.refresh, "", { token })
};
