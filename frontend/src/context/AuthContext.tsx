import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  id: number | null;
  token: string | null;
  username: string | null;
  roles: string[];
  perms: string[];
  login: (id:number, token: string, username: string) => void;
  logout: () => void;
  refreshPerms: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  id: null,
  token: null,
  username: null,
  roles: [],
  perms: [],
  login: async () => {},
  logout: () => {},
  refreshPerms: async () => {},
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

  const refreshPerms = async (t?: string) => {
    const tok = t ?? token;
    if (!tok) {
      setRoles([]);
      setPerms([]);
      return;
    }
    try {
      const res = await fetch("/me/permissions", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setPerms(data.perms || []);
      }
    } catch {
      /* ignore */
    }
  };

  const login = (newId: number, newToken: string, name: string) => {
    setId(newId);
    setToken(newToken);
    setUsername(name);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', name);
    localStorage.setItem('userid', String(newId));
    refreshPerms(newToken);
  };

  const logout = () => {
    setId(null);
    setToken(null);
    setUsername(null);
    setRoles([]);
    setPerms([]);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userid');
  };

  useEffect(() => {
    refreshPerms();
  }, [token]);

  // intercept fetch 403 to refresh permissions
  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await orig(input, init);
      if (res.status === 403) {
        refreshPerms();
      }
      return res;
    };
    return () => {
      window.fetch = orig;
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ id, token, username, roles, perms, login, logout, refreshPerms }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
