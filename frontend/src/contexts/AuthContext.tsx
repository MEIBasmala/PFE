// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  getUser,
  setUser as saveUser,
  removeUser,
  setToken,
  removeToken,
  getToken,
  logout as clientLogout,
} from "@/services/api/client";
import { authApi } from "@/services/api/auth.api";
import type { User } from "@/types/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (token: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

    const refreshUser = async (): Promise<void> => {
    try {
      const res = await authApi.getProfile();
      const freshUser = (res as any).user ?? res;
      setUser(freshUser as User);
      saveUser(freshUser);
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      const isAuthFailure =
        msg.includes("session expired") ||
        msg.includes("not authorized") ||
        msg.includes("invalid token") ||
        err?.status === 401;

      // FIXED: removed || !getToken(). A missing access token in localStorage
      // does NOT mean the session is dead — the httpOnly refresh cookie might
      // still be valid. Only logout when the server explicitly says so.
      if (isAuthFailure) {
        setUser(null);
        removeUser();
        removeToken();
      }
      // Network hiccups / 500s: swallow and keep stale user in state.
    }
  };

  useEffect(() => {
    const restore = async () => {
      const saved = getUser<User>();

      // We intentionally do NOT gate this on getToken()/checkAuth().
      // The token string in localStorage may be expired — that's fine.
      // The httpOnly refresh cookie is the real source of truth.
      if (
        saved &&
        typeof saved === "object" &&
        "id" in saved &&
        "role" in saved
      ) {
        // 1. Render saved user instantly — kills the login-page flicker.
        setUser(saved);
        // 2. Background validation / silent refresh.
        await refreshUser();
      } else {
        // Truly nothing to restore.
        setUser(null);
        removeUser();
        removeToken();
      }

      setLoading(false);
    };

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { token, user } = await authApi.login({ email, password });
    setToken(token);
    setUser(user);
    saveUser(user);
    return user;
  };

  const googleLogin = async (token: string): Promise<User> => {
    setToken(token);
    try {
      const res = await authApi.getProfile();
      const user = (res as any).user ?? res;
      setUser(user as User);
      saveUser(user);
      return user as User;
    } catch (err) {
      removeToken();
      removeUser();
      setUser(null);
      throw err;
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<User> => {
    const { token, user } = await authApi.register({
      fullName,
      email,
      password,
    });
    setToken(token);
    setUser(user);
    saveUser(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    removeUser();
    removeToken();
    try {
      await clientLogout(false);
    } catch {
      // Ignore logout API errors
    }
  };

  const updateUser = (u: User) => {
    setUser(u);
    saveUser(u);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};