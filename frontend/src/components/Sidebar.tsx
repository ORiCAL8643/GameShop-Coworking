import { Layout, Menu, message } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const { Sider } = Layout;
type GroupItem = Required<MenuProps>["items"][number];

const items: GroupItem[] = [
  {
    key: "/home",
    label: "หน้าแรก",
  },
  {
    key: "/request",
    label: "รีเควสเกม",
  },
  {
    key: "/requestinfo",
    label: "ข้อมูลรีเควส",
  },
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

  {
    key: "/workshop",
    label: "Workshop",
  },
    {
    key: '/promotion',
    label:'Promotion',
  },
  {
    key: '/refund',
    label:'การคืนเงินผู้ใช้',
  },
  {
    key: '/Admin',
    label:'Admin',
    children: [
        { key: '/Admin/Page', label: 'Page', icon:<PlusOutlined />},
        { key: '/Admin/PaymentReviewPage', label: 'PaymentReview', icon:<PlusOutlined />},
        { key: '/Admin/RolePage', label: 'Role', icon:<PlusOutlined />},
    ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useAuth();

  // เส้นทางที่เป็น "กลุ่ม" (มี children)
  const rootSubmenuKeys = useMemo(() => ["/information", "/category"], []);

  // คีย์ที่เลือกอยู่ (ตามเส้นทางปัจจุบัน)
  const selectedKey = location.pathname;

  const computeOpenKeys = (path: string) =>
    rootSubmenuKeys.filter((k) => path.startsWith(k));

  const [openKeys, setOpenKeys] = useState<string[]>(computeOpenKeys(selectedKey));

  useEffect(() => {
    // เปลี่ยนหน้าแล้วให้เปิดเมนูย่อยที่ตรงกับ path ปัจจุบัน
    setOpenKeys(computeOpenKeys(selectedKey));
  }, [selectedKey]);

  const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
    // อนุญาตเปิดได้หลายกลุ่มพร้อมกัน (ถ้าอยากเปิดทีละกลุ่ม ให้คอมเมนต์โค้ดนี้แล้วใช้ logic แบบ antd ตัวอย่าง)
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
          onClick={({ key }) => {
            const path = String(key);
            if (path.startsWith("/Admin") && !permissions.includes("roles.manage")) {
              message.warning("คุณไม่มีสิทธิ์เข้าถึง");
              return;
            }
            navigate(path);
          }}
        />
      </Sider>

      {/* เนื้อหาหลัก */}
      <Outlet />
    </Layout>
  );
};

export default Sidebar;
