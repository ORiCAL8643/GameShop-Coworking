import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";

interface RoleInfo { id: number; title: string }
interface MeInfo { id: number; username: string; email: string; role?: RoleInfo }

interface AuthContextType {
  ready: boolean;
  isAuthenticated: boolean;
  me?: MeInfo;
  permissions: string[];
  token: string | null;
  id: number | null;
  userId: number | null;
  username: string | null;
  login: (id: number, token: string, username: string, email?: string) => void;
  logout: () => void;
  can: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  ready: false,
  isAuthenticated: false,
  permissions: [],
  token: null,
  id: null,
  userId: null,
  username: null,
  login: () => {},
  logout: () => {},
  can: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [me, setMe] = useState<MeInfo | undefined>();
  const [permissions, setPermissions] = useState<string[]>([]);

  const loadMe = useCallback(async () => {
    const t = localStorage.getItem("token");
    setToken(t);
    if (!t) {
      setMe(undefined);
      setPermissions([]);
      setReady(true);
      return;
    }
    try {
      const { data } = await api.get("/me");
      if (data && data.id) {
        setMe({ id: data.id, username: data.username, email: data.email, role: data.role });
        setPermissions(data.permissions || []);
      } else {
        setMe(undefined);
        setPermissions([]);
      }
    } catch {
      setMe(undefined);
      setPermissions([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadMe();
    const id = setInterval(loadMe, 60000);
    return () => clearInterval(id);
  }, [loadMe]);

  const login = (id: number, tk: string, username: string, email?: string) => {
    localStorage.setItem("token", tk);
    setToken(tk);
    setMe({ id, username, email: email || "", role: me?.role });
    setReady(false);
    loadMe();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setMe(undefined);
    setPermissions([]);
    setReady(true);
  };

  const value: AuthContextType = {
    ready,
    isAuthenticated: !!me,
    me,
    permissions,
    token,
    id: me?.id ?? null,
    userId: me?.id ?? null,
    username: me?.username ?? null,
    login,
    logout,
    can: (perm: string) => permissions.includes(perm),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
