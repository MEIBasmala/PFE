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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<void> => {
    if (!checkAuth()) {
      setUser(null);
      return;
    }
    try {
      const res = await authApi.getProfile();
      const freshUser = (res as any).user ?? res;
      setUser(freshUser as User);
      saveUser(freshUser);
    } catch {
      // Token invalid — clear everything silently
      setUser(null);
      removeUser();
      removeToken();
    }
  };

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = getUser<User>();
        // Validate saved user has required fields
        if (saved && typeof saved === 'object' && 'id' in saved && 'role' in saved && checkAuth()) {
          setUser(saved);
          await refreshUser();
        } else {
          // Invalid saved data — clear it
          setUser(null);
          removeUser();
          removeToken();
        }
      } catch {
        // localStorage read failed
        setUser(null);
        removeUser();
        removeToken();
      } finally {
        setLoading(false);
      }
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
    try {
      await clientLogout(false);
    } catch {
      // Ignore logout API errors
    }
    // Use React Router navigation instead of window.location
    // This prevents full page reload which breaks SPA on Vercel
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