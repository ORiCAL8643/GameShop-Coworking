import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  username: string | null;
  userId: number | null;
  login: (token: string, username: string, userId: number) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  username: null,
  userId: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('userId');
    return stored ? Number(stored) : null;
  });

  const login = async (newToken: string, name: string, id: number) => {
    setToken(newToken);
    setUsername(name);
    setUserId(id);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', name);
    localStorage.setItem('userId', String(id));
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('orderId');
  };

  return (
    <AuthContext.Provider value={{ token, username, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
