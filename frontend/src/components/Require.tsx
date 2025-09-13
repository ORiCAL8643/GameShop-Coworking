import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { id } = useAuth();
  const loc = useLocation();
  if (!id) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return <>{children}</>;
};

export const RequirePerm = ({ need, children }: { need: string | string[]; children: ReactNode }) => {
  const { perms } = useAuth();
  const needs = Array.isArray(need) ? need : [need];
  const ok = needs.some((p) => perms.includes(p));
  if (!ok) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

