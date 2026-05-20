import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api, getToken, setToken } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return { email: payload.email };
    } catch {
      setToken(null);
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      const data = await api.login(email, password);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authLoading,
      login,
      logout,
    }),
    [user, authLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
