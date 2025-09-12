import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";

const { Sider, Content } = Layout;
type GroupItem = Required<MenuProps>["items"][number];

const items: GroupItem[] = [
  { key: "/home", label: "หน้าแรก" },
  { key: "/request", label: "รีเควสเกม" },
  { key: "/requestinfo", label: "ข้อมูลรีเควส" },
  {
    key: "/information",
    label: "จัดการข้อมูลเกม",
    children: [
      { key: "/information/Add",  label: "เพิ่มเกม",        icon: <PlusOutlined /> },
      { key: "/information/Edit", label: "แก้ไขข้อมูลเกม", icon: <PlusOutlined /> },
    ],
  },
  {
    key: "/category",
    label: "หมวดหมู่",
    children: [
      { key: "/category/Community", label: "ชุมชน",     icon: <PlusOutlined /> },
      { key: "/category/Payment",   label: "การชำระเงิน", icon: <PlusOutlined /> },
    ],
  },
  { key: "/workshop", label: "Workshop" },
  { key: "/promotion", label: "Promotion" },
  { key: "/refund", label: "การคืนเงินผู้ใช้" },
  {
    key: "/Admin",
    label: "Admin",
    children: [
      { key: "/Admin/Page",              label: "Page",          icon: <PlusOutlined /> },
      { key: "/Admin/PaymentReviewPage", label: "PaymentReview", icon: <PlusOutlined /> },
      { key: "/Admin/RolePage",          label: "Role",          icon: <PlusOutlined /> },
    ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const rootSubmenuKeys = useMemo(() => ["/information", "/category", "/Admin"], []);
  const selectedKey = location.pathname;
  const computeOpenKeys = (path: string) => rootSubmenuKeys.filter((k) => path.startsWith(k));
  const [openKeys, setOpenKeys] = useState<string[]>(computeOpenKeys(selectedKey));

  useEffect(() => setOpenKeys(computeOpenKeys(selectedKey)), [selectedKey]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" width={220}>
        <div style={{ color: "#9254de", fontSize: 20, textAlign: "center", padding: "16px 0", fontWeight: 600 }}>
          GAME STORE
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>

      {/* ✅ โซนเนื้อหาหลักต้องอยู่ใน Content */}
      <Layout style={{ background: "#0f0f0f" }}>
        <Content style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
          {/* padding รวมของทุกหน้า (ถ้าบางหน้าต้องเต็มขอบ ก็ย้าย paddingไปรอบในหน้านั้นได้) */}
          <div style={{ padding: "16px 24px" }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
