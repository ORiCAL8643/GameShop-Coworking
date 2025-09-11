import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  id: number | null;
  token: string | null;
  username: string | null;
  permissions: string[];
  login: (id: number, token: string, username: string, permissions: string[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  id: null,
  token: null,
  username: null,
  permissions: [],
  login: () => {},
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

  return (
    <AuthContext.Provider value={{ id, token, username, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
