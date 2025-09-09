import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  id: number | null;
  token: string | null;
  username: string | null;
  login: (id:number, token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  id: null,
  token: null,
  username: null,
  userId: null,
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
  const login = (newId: number, newToken: string, name: string) => {
    setId(newId);
    setToken(newToken);
    setUsername(name);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      const id = typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);
      setUserId(id);
      localStorage.setItem('userId', String(id));
    } catch {
      setUserId(null);
      localStorage.removeItem('userId');
    }
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', name);
    localStorage.setItem('userid', String(newId));
  };

  const logout = () => {
    setId(null);
    setToken(null);
    setUsername(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userid');
  };

  return (
    <AuthContext.Provider value={{ id, token, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
