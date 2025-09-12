import { Layout, Menu, Badge } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import AdminPageBadge from "./AdminPageBadge";
import { useReportNewCount } from "../hooks/useReportNewCount"; // 👈 สมมติคุณมี hook นี้

const { Sider } = Layout;
type GroupItem = Required<MenuProps>["items"][number];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reportCount = useReportNewCount();

  // เส้นทางที่เป็น "กลุ่ม" (มี children)
  const rootSubmenuKeys = useMemo(
    () => ["/information", "/category", "/Admin"],
    []
  );

  // คีย์ที่เลือกอยู่ (ตามเส้นทางปัจจุบัน)
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

  const items: GroupItem[] = [
    { key: "/home", label: "หน้าแรก" },
    { key: "/request", label: "รีเควสเกม" },
    { key: "/requestinfo", label: "ข้อมูลรีเควส" },
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
    { key: "/report", label: "รายงานปัญหา" },
    {
      key: "/Admin",
      label: "Admin",
      children: [
        {
          key: "/Admin/Page",
          icon: <PlusOutlined />,
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Page
              {reportCount > 0 && (
                <Badge count={reportCount} size="small" offset={[4, -2]} />
              )}
            </span>
          ),
        },
        {
          key: "/Admin/PaymentReviewPage",
          label: "PaymentReview",
          icon: <PlusOutlined />,
        },
        { key: "/Admin/RolePage", label: "Role", icon: <PlusOutlined /> },
      ],
    },
  ];

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
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>

      {/* เนื้อหาหลัก */}
      <Outlet />
    </Layout>
  );
};

export default Sidebar;
