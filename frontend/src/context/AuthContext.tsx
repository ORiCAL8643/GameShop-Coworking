import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  username: string | null;
  userId: number | null;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  username: null,
  userId: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [userId, setUserId] = useState<number | null>(
    localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  );

  const login = (newToken: string, name: string) => {
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
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ token, username, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
