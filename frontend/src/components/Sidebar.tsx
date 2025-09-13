// src/components/Sidebar.tsx
import { Layout, Menu, Badge } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { DollarOutlined, FlagOutlined, HomeOutlined, PlusOutlined, RetweetOutlined, SendOutlined, TeamOutlined, ToolOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useReportNewCount } from "../hooks/useReportNewCount";
import type { ItemType } from "antd/es/menu/interface";
import { FlagIcon } from "lucide-react";

const { Sider, Content } = Layout;
type GroupItem = Required<MenuProps>["items"][number];

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
    { key: "/home", label: "หน้าแรก", icon: <HomeOutlined/> },
    { key: "/request", label: "รีเควสเกม", icon: <SendOutlined /> },
    { key: "/category/Community", label: "ชุมชน", icon: <TeamOutlined /> },
    { key: "/category/Payment", label: "การชำระเงิน", icon: <DollarOutlined /> }, 
    { key: "/workshop", label: "Workshop", icon: <ToolOutlined /> },  
    { key: "/refund", label: "การคืนเงินผู้ใช้", icon: <RetweetOutlined/> },
    { key: "/report", label: "รายงานปัญหา", icon: <FlagOutlined /> },
    {
      key: "/Admin",
      label: "Admin",
      children: [
        { key: "/information/Add", label: "เพิ่มเกม", icon: <PlusOutlined /> },
        { key: "/requestinfo", label: "ข้อมูลรีเควส", icon: <PlusOutlined /> },
        { key: "/promotion", label: "Promotion", icon: <PlusOutlined />  },
        { key: "/Admin/Page", label: adminPageLabel, icon: <PlusOutlined />,},
        { key: "/Admin/PaymentReviewPage",label: "PaymentReview", icon: <PlusOutlined />,},
        { key: "/Admin/RolePage", label: "Role", icon: <PlusOutlined /> },
        
      ],
    },
  ];

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
            <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
