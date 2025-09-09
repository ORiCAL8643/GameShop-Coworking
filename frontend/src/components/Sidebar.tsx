import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";

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

  // 👇 เมนูระบบบทบาท (Role)
  {
    key: "/roles",
    label: "บทบาท (Role)",
  },

  {
    key: "/workshop",
    label: "Workshop",
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>

      {/* เนื้อหาหลัก */}
      <Outlet />
    </Layout>
  );
};

export default Sidebar;
