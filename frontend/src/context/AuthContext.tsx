import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface Role { id: number; name: string }
interface User { id: number; email: string }

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: Set<string>;
  token: string | null;
  login: (id: number, token: string, username: string) => void;
  logout: () => void;
  hasPerm: (perm: string) => boolean;
  hasAny: (perms: string[]) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  permissions: new Set(),
  token: null,
  login: () => {},
  logout: () => {},
  hasPerm: () => false,
  hasAny: () => false,
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const hasPerm = (perm: string) => permissions.has(perm);
  const hasAny = (perms: string[]) => perms.some((p) => permissions.has(p));

  const refresh = async () => {
    if (!token) return;
    const res = await fetch("http://localhost:8088/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUser({ id: data.id, email: data.email });
      setRole(data.role);
      setPermissions(new Set<string>(data.permissions || []));
    }
  };

  useEffect(() => { refresh(); }, [token]);

  const login = (id: number, newToken: string, _username: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("userid", String(id));
    refresh();
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setPermissions(new Set());
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userid");
  };

  return (
    <AuthContext.Provider value={{ user, role, permissions, token, login, logout, hasPerm, hasAny, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

