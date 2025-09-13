import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';

interface AuthContextType {
  id: number | null;
  token: string | null;
  username: string | null;
  roles: string[];
  perms: string[];
  login: (id:number, token: string, username: string) => void;
  logout: () => void;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  id: null,
  token: null,
  username: null,
  roles: [],
  perms: [],
  login: () => {},
  logout: () => {},
  refreshPermissions: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [id, setId] = useState<number | null>(() => {
    const s = localStorage.getItem("userid");
    return s ? Number(s) : null;
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [perms, setPerms] = useState<string[]>([]);

  const refreshPermissions = async () => {
    if (!token) {
      setRoles([]);
      setPerms([]);
      return;
    }
    try {
      const res = await api.get('/me/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data.roles || []);
      setPerms(res.data.perms || []);
    } catch {
      setRoles([]);
      setPerms([]);
    }
  };

  const login = (newId: number, newToken: string, name: string) => {
    setId(newId);
    setToken(newToken);
    setUsername(name);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', name);
    localStorage.setItem('userid', String(newId));
    refreshPermissions();
  };

  const logout = () => {
    setId(null);
    setToken(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userid');
    setRoles([]);
    setPerms([]);
  };

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
    refreshPermissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      resp => resp,
      async err => {
        if (err.response && err.response.status === 403) {
          await refreshPermissions();
        }
        return Promise.reject(err);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ id, token, username, roles, perms, login, logout, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
