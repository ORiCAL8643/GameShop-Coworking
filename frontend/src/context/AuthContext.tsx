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
  refreshPerms: (t?: string) => Promise<void>;
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

// ✅ ชี้ API backend ให้ชัด
const API_BASE =  "http://localhost:8088";
 // (import.meta as any)?.env?.VITE_API_BASE ??
  //(import.meta as any)?.env?.VITE_API_URL ??
  

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken]     = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [id, setId]           = useState<number | null>(() => {
    const s = localStorage.getItem("userid");
    return s ? Number(s) : null;
  });
  const [roles, setRoles]     = useState<string[]>([]);
  const [perms, setPerms]     = useState<string[]>([]);

  const refreshPerms = async (t?: string) => {
    const tok = t ?? token;
    if (!tok) {
      setRoles([]);
      setPerms([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/me/permissions`, {
        headers: {
          Authorization: `Bearer ${tok}`,
          // ป้องกัน cache เก่า ๆ ของ dev server
          "Cache-Control": "no-cache",
        },
      });

      if (res.status === 401) {
        // token หมดอายุ/ไม่ถูกต้อง → เคลียร์สิทธิ
        setRoles([]);
        setPerms([]);
        return;
      }
      if (res.status === 403) {
        // สิทธิไม่พอ → อย่างน้อยรีเฟรช state ให้เป็นปัจจุบัน
        setRoles([]);
        setPerms([]);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setRoles(Array.isArray(data.roles) ? data.roles : []);
        setPerms(Array.isArray(data.perms) ? data.perms : []);
      } else {
        // กรณีอื่น ๆ: กัน state ค้าง
        setRoles([]);
        setPerms([]);
      }
    } catch {
      // เครือข่ายล่ม/แบ็กเอนด์ไม่ขึ้น
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
    // ✅ ดึงสิทธิใหม่จากแบ็กเอนด์ทันทีหลังล็อกอิน
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

  // เปลี่ยน token → โหลดสิทธิใหม่
  useEffect(() => {
    refreshPerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ดัก 401/403 ที่เกิดหลังบ้านเพิ่งเปลี่ยนสิทธิ แล้วรีเฟรช perms อัตโนมัติ
  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await orig(input, init);
      if (res.status === 401 || res.status === 403) {
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
