import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  id: number | null;
  token: string | null;
  username: string | null;
  role: string | null;
  permissions: string[];
  login: (
    id: number,
    token: string,
    username: string,
    role: string,
    permissions: string[],
  ) => void;
  logout: () => void;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  id: null,
  token: null,
  username: null,
  role: null,
  permissions: [],
  login: () => {},
  logout: () => {},
  hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [permissions, setPermissions] = useState<string[]>(() => {
    const s = localStorage.getItem('permissions');
    try { return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [id, setId] = useState<number | null>(() => {
    const s = localStorage.getItem("userid");
    return s ? Number(s) : null;
  });
  const login = (
    newId: number,
    newToken: string,
    name: string,
    newRole: string,
    perms: string[],
  ) => {
    setId(newId);
    setToken(newToken);
    setUsername(name);
    setRole(newRole);
    setPermissions(perms);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', name);
    localStorage.setItem('userid', String(newId));
    localStorage.setItem('role', newRole);
    localStorage.setItem('permissions', JSON.stringify(perms));
  };

  const logout = () => {
    setId(null);
    setToken(null);
    setUsername(null);
    setRole(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
  };

  const hasPermission = (key: string) => permissions.includes(key);

  return (
    <AuthContext.Provider value={{ id, token, username, role, permissions, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
