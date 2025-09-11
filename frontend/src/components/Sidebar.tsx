import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import AdminPageBadge from "./AdminPageBadge"; // ✅ แสดงเลขแจ้งเตือนคำร้องใหม่

const { Sider } = Layout;
type GroupItem = Required<MenuProps>["items"][number];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ ย้าย items มาอยู่ในคอมโพเนนต์ เพื่อให้ label เป็น ReactNode ได้ (AdminPageBadge ใช้ hook ภายใน)
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

    // ✅ เมนูรีพอร์ตปัญหา (ไปหน้า /report)
    {
      key: "/report",
      label: "รีพอร์ตปัญหา",
    },
    {
      key: "/promotion",
      label: "Promotion",
    },
    {
      key: "/refund",
      label: "การคืนเงินผู้ใช้",
    },
    {
      key: "/Admin",
      label: "Admin",
      children: [
        // ⬇️ แทนที่ "Page" ด้วย Badge ที่มีเลขแจ้งเตือน
        { key: "/Admin/Page", label: <AdminPageBadge />, icon: <PlusOutlined /> },
        { key: "/Admin/PaymentReviewPage", label: "PaymentReview", icon: <PlusOutlined /> },
        { key: "/Admin/RolePage", label: "Report", icon: <PlusOutlined /> },
      ],
    },
  ];

  return (
    <Layout>
      <Sider theme="dark" width={220}>
        <div
          style={{
            color: "#9254de",
            fontSize: 20,
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          GAME STORE
        </div>

        <Menu
          theme="dark"
          mode="inline"
          items={items}
          // ✅ ไฮไลต์ตามเส้นทางปัจจุบัน
          selectedKeys={[location.pathname]}
          // (ตัวเลือก) เปิดเมนูกลุ่มหลักไว้เสมอ
          defaultOpenKeys={["/information", "/category", "/Admin"]}
          onClick={({ key }) => {
            navigate(key as string);
          }}
        />
      </Sider>
      <Outlet />
    </Layout>
  );
};

export default Sidebar;
