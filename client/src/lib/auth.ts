import { User } from "@shared/schema";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const getAuthState = (): AuthState => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  return {
    user,
    token,
    isAuthenticated: !!(token && user),
  };
};

export const setAuthState = (user: User, token: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearAuthState = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
