import { useState, useEffect } from "react";
import { User } from "@shared/schema";
import { getAuthState, setAuthState, clearAuthState } from "@/lib/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authState = getAuthState();
    setUser(authState.user);
    setToken(authState.token);
    setIsAuthenticated(authState.isAuthenticated);
    setIsLoading(false);
  }, []);

  const login = (user: User, token: string) => {
    setAuthState(user, token);
    setUser(user);
    setToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearAuthState();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser: User) => {
    if (token) {
      setAuthState(updatedUser, token);
      setUser(updatedUser);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };
};
