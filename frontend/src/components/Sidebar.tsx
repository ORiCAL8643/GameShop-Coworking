import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";

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
      { key: "/Admin/PaymentReviewPage", label: "PaymentReview", icon: <PlusOutlined /> },
      { key: "/Admin/RolePage", label: "Report", icon: <PlusOutlined /> },
    ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* LEFT: เมนู */}
      <Sider theme="dark" width={220} breakpoint="lg" collapsedWidth={64}>
        <div style={{ color: "#9254de", fontSize: 20, textAlign: "center", padding: "16px 0" }}>
          GAME STORE
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={[pathname]}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      {/* RIGHT: พื้นที่คอนเทนต์ (สกรอลล์หลักเพียงตัวเดียว) */}
      <Layout>
        <Content
          style={{
            height: "100vh",
            overflow: "auto",
            background: "#0d0d0d",
            color: "#fff",
          }}
        >
          {/* ให้เพจเป็นคนกำหนด padding เอง (Reviewpage มี p-6 แล้ว) */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
