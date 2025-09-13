import React from "react";
import { useAuth } from "../context/AuthContext";

export const Can: React.FC<{ perm: string; children: React.ReactNode }> = ({ perm, children }) => {
  const { hasPerm } = useAuth();
  if (!hasPerm(perm)) return null;
  return <>{children}</>;
};

export const CanAny: React.FC<{ perms: string[]; children: React.ReactNode }> = ({ perms, children }) => {
  const { hasAny } = useAuth();
  if (!hasAny(perms)) return null;
  return <>{children}</>;
};

export default Can;

