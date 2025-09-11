import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PlusOutlined, BugOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";

const { Sider } = Layout;
type ItemType = Required<MenuProps>["items"][number];

const items: ItemType[] = [
  { key: "/home", label: "หน้าแรก" },
  { key: "/request", label: "รีเควสเกม" },
  { key: "/requestinfo", label: "ข้อมูลรีเควส" },

  // ✅ เมนูรีพอร์ตปัญหา (หน้า user ส่งคำร้อง)
  { key: "/report", label: "รีพอร์ตปัญหา", icon: <BugOutlined /> },

  {
    key: "/information",
    label: "จัดการข้อมูลเกม",
    children: [
      { key: "/information/Add", label: "เพิ่มเกม", icon: <PlusOutlined /> },
      { key: "/information/Edit", label: "แก้ไขข้อมูลเกม", icon: <PlusOutlined /> },
    ],
  },
  {
    key: "/category",
    label: "หมวดหมู่",
    children: [
      { key: "/category/Community", label: "ชุมชน", icon: <PlusOutlined /> },
      { key: "/category/Payment", label: "การชำระเงิน", icon: <PlusOutlined /> },
    ],
  },

  { key: "/workshop", label: "Workshop" },
  { key: "/promotion", label: "Promotion" },
  { key: "/refund", label: "การคืนเงินผู้ใช้" },

  {
    key: "/Admin",
    label: "Admin",
    children: [
      { key: "/Admin/Page", label: "Page", icon: <PlusOutlined /> },
      // (ถ้าคุณใช้หน้าจัดการรีพอร์ตฝั่งแอดมินแบบที่เราทำไว้)
      { key: "/Admin/Reports", label: "Report (Open)", icon: <PlusOutlined /> },
      { key: "/Admin/ResolvedReports", label: "Resolved Reports", icon: <PlusOutlined /> },
      { key: "/Admin/PaymentReviewPage", label: "PaymentReview", icon: <PlusOutlined /> },
      { key: "/Admin/RolePage", label: "Role", icon: <PlusOutlined /> },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // กลุ่มเมนูหลักที่มี children (ใช้เพื่อควบคุม open/close)
  const rootSubmenuKeys = useMemo(() => ["/information", "/category", "/Admin"], []);
  const selectedKey = location.pathname;

  const computeOpenKeys = (path: string) =>
    rootSubmenuKeys.filter((k) => path.startsWith(k));

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
            fontWeight: 700,
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
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>
      <Outlet />
    </Layout>
  );
}
