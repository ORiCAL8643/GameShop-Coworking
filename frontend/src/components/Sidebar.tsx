// src/components/Sidebar.tsx
import { Layout, Menu, Badge } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useReportNewCount } from "../hooks/useReportNewCount";

const { Sider } = Layout;
type ItemType = Required<MenuProps>["items"][number];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ นับเคสใหม่ทุก 8s (หรือปรับตามต้องการ)
  const reportCount = useReportNewCount(8000);

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

  // ✅ Label Page + Badge (โชว์แม้เป็น 0)
  const adminPageLabel = (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span>Page</span>
      <Badge
        count={reportCount}
        overflowCount={99}
        color="#f759ab"
        style={{ marginLeft: 4, boxShadow: "none" }}
      />
    </span>
  );

  const items: ItemType[] = [
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
          label: adminPageLabel, // ✅ Page + Badge
        },
        {
          key: "/Admin/PaymentReviewPage",
          label: "PaymentReview",
          icon: <PlusOutlined />,
        },
        { key: "/Admin/RolePage", label: "Role", icon: <PlusOutlined /> },
        // ❌ ไม่ใส่ Resolved Reports อีกแล้ว
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

      <Outlet />
    </Layout>
  );
};

export default Sidebar;
