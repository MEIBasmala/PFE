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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount.
    // Also verify the token is still valid by calling /auth/me.
    // If it fails (expired, tampered), clear everything silently.
    const restore = async () => {
      const saved = getUser<User>();
      if (saved && checkAuth()) {
        setUser(saved); // optimistically set so UI doesn't flash
        try {
          const res = await authApi.getProfile(); // GET /auth/me
          // Backend returns { success: true, user: {...} }
          const freshUser = (res as any).user ?? res;
          setUser(freshUser as User);
          saveUser(freshUser);
        } catch {
          // Token is invalid/expired and refresh also failed — clear everything
          setUser(null);
          removeUser();
          removeToken();
        }
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
    // Clear local state first so UI updates immediately
    setUser(null);
    removeUser();
    removeToken();
    // Then tell the server to clear the httpOnly refresh token cookie.
    // clientLogout(false) = don't redirect — we handle navigation ourselves.
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