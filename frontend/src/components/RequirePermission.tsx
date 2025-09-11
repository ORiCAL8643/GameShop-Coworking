import React from 'react';
import { useAuth } from '../context/AuthContext';

interface Props {
  anyOf: string[];
  children: React.ReactElement;
}

const RequirePermission: React.FC<Props> = ({ anyOf, children }) => {
  const { permissions } = useAuth();
  const allowed = anyOf.some((p) => permissions.includes(p));
  if (!allowed) {
    return <div style={{ padding: 24 }}>คุณไม่สามารถเข้าถึงหน้านี้ได้ เนื่องจากไม่มีสิทธิ์</div>;
  }
  return children;
};

export default RequirePermission;
