import { Navigate, Outlet } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../context/AuthContext";

interface Props {
  permission: string;
}

const RequirePermission: React.FC<Props> = ({ permission }) => {
  const { permissions } = useAuth();
  if (!permissions.includes(permission)) {
    message.warning("คุณไม่มีสิทธิ์เข้าถึง");
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
};

export default RequirePermission;
