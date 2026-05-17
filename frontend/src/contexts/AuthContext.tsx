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
  isAuthenticated as checkAuth,
  logout as clientLogout,
} from "@/services/api/client";
import { authApi } from "@/services/api/auth.api";
import type { User } from "@/types/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;   // ← ADDED
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Reusable profile fetcher ───────────────────────────────────────────────
  const refreshUser = async (): Promise<void> => {
    if (!checkAuth()) return;
    try {
      const res = await authApi.getProfile(); // GET /auth/me
      const freshUser = (res as any).user ?? res;
      setUser(freshUser as User);
      saveUser(freshUser);
    } catch {
      // Token invalid — clear silently
      setUser(null);
      removeUser();
      removeToken();
    }
  };

  useEffect(() => {
    const restore = async () => {
      const saved = getUser<User>();
      if (saved && checkAuth()) {
        setUser(saved); // optimistic
        await refreshUser(); // verify + refresh
      }
      setLoading(false);
    };

    restore();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { token, user } = await authApi.login({ email, password });
    setToken(token);
    setUser(user);
    saveUser(user);
    return user;
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<User> => {
    const { token, user } = await authApi.register({ fullName, email, password });
    setToken(token);
    setUser(user);
    saveUser(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    removeUser();
    removeToken();
    await clientLogout(false);
    window.location.href = '/auth';
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
        register,
        logout,
        updateUser,
        refreshUser,   // ← ADDED
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