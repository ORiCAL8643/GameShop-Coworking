import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can, isAuthenticated } = useAuth();

  const items: MenuProps["items"] = [];
  items.push({ key: "home", label: "Home" });
  if (!isAuthenticated) {
    items.push({ key: "login", label: "Login" });
    items.push({ key: "register", label: "Register" });
  }
  if (can("requests.create")) items.push({ key: "request", label: "รีเควสเกม" });
  if (can("requests.read")) items.push({ key: "requestinfo", label: "ข้อมูลรีเควส" });
  if (can("games.manage")) {
    items.push({
      key: "information",
      label: "จัดการข้อมูลเกม",
      children: [
        { key: "information/add", label: "เพิ่มเกม" },
        { key: "information/edit", label: "แก้ไขข้อมูลเกม" },
      ],
    });
  }
  const catChildren: MenuProps["items"] = [];
  if (can("community.read")) catChildren.push({ key: "category/community", label: "ชุมชน" });
  if (can("payments.create")) catChildren.push({ key: "category/payment", label: "การชำระเงิน" });
  if (catChildren.length > 0) items.push({ key: "category", label: "หมวดหมู่", children: catChildren });
  if (can("workshop.read")) items.push({ key: "workshop", label: "Workshop" });
  if (can("workshop.create")) items.push({ key: "upload", label: "Upload" });
  if (can("promotions.manage") || can("promotions.read")) items.push({ key: "promotion", label: "Promotion" });
  if (can("refunds.manage")) items.push({ key: "refund", label: "การคืนเงินผู้ใช้" });
  if (can("roles.manage") || can("payments.manage")) {
    const adminChildren: MenuProps["items"] = [];
    if (can("roles.manage")) {
      adminChildren.push({ key: "Admin", label: "Page" });
      adminChildren.push({ key: "Admin/RolePage", label: "Role" });
    }
    if (can("payments.manage")) {
      adminChildren.push({ key: "Admin/PaymentReviewPage", label: "PaymentReview" });
    }
    if (adminChildren.length > 0) items.push({ key: "admin", label: "Admin", children: adminChildren });
  }

  const rootSubmenuKeys = useMemo(() => ["information", "category", "admin"], []);
  const selectedKey = location.pathname.replace(/^\/+/, "") || "home";
  const computeOpenKeys = (path: string) => rootSubmenuKeys.filter((k) => path.startsWith(k));
  const [openKeys, setOpenKeys] = useState<string[]>(computeOpenKeys(selectedKey));

  useEffect(() => {
    setOpenKeys(computeOpenKeys(selectedKey));
  }, [selectedKey]);

  const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
    setOpenKeys(keys as string[]);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" width={220}>
        <div
          style={{
            color: "#9254de",
            fontSize: 20,
            textAlign: "center",
            padding: "16px 0",
            fontWeight: 600,
          }}
        >
          GAME STORE
        </div>

        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Outlet />
    </Layout>
  );
};

export default Sidebar;
