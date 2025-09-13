import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function AdminRoute({ need, children }: { need: string; children: ReactNode }) {
  const { perms } = useAuth();
  const has = (p: string) => perms.includes("admin:all") || perms.includes(p);
  if (!has("admin:panel") || !has(need)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

