import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  id: number | null;
  token: string | null;
  username: string | null;
  permissions: string[];
  login: (id: number, token: string, username: string, permissions: string[]) => void;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  id: null,
  token: null,
  username: null,
  permissions: [],
  login: () => {},
  refresh: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [id, setId] = useState<number | null>(() => {
    const s = localStorage.getItem("userid");
    return s ? Number(s) : null;
  });
  const [permissions, setPermissions] = useState<string[]>(() => {
    const p = localStorage.getItem('permissions');
    return p ? JSON.parse(p) : [];
  });
  const login = (newId: number, newToken: string, name: string, perms: string[]) => {
    setId(newId);
    setToken(newToken);
    setUsername(name);
    setPermissions(perms);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', name);
    localStorage.setItem('userid', String(newId));
    localStorage.setItem('permissions', JSON.stringify(perms));
  };

  const refresh = async () => {
    const tk = localStorage.getItem('token');
    if (!tk) return;
    try {
      const res = await fetch('http://localhost:8088/me', {
        headers: {
          Authorization: `Bearer ${tk}`,
        },
      });
      if (!res.ok) throw new Error('unauthorized');
      const data = await res.json();
      setId(data.id);
      setUsername(data.username);
      setPermissions(data.permissions || []);
      localStorage.setItem('userid', String(data.id));
      localStorage.setItem('username', data.username);
      localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
    } catch {
      logout();
      window.location.href = '/login';
    }
  };

  const logout = () => {
    setId(null);
    setToken(null);
    setUsername(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userid');
    localStorage.removeItem('permissions');
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [token]);

  return (
    <AuthContext.Provider value={{ id, token, username, permissions, login, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
