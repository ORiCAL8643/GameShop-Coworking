import React from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../context/AuthContext";

export default function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { ready, isAuthenticated, permissions } = useAuth();
  if (!ready) return <Spin fullscreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!permissions.includes(permission)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}
