// src/components/Sidebar.tsx
import { Layout, Menu, Badge } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  DollarOutlined, FlagOutlined, HomeOutlined, PlusOutlined,
  RetweetOutlined, SendOutlined, TeamOutlined, ToolOutlined
} from "@ant-design/icons";
import { useEffect, useMemo, useState, useCallback } from "react"; // ⬅️ useCallback
import { useReportNewCount } from "../hooks/useReportNewCount";
import type { ItemType } from "antd/es/menu/interface";
import { useAuth } from "../context/AuthContext";

const { Sider, Content } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const reportCount = useReportNewCount(8000);

  // ⬇️ กัน perms undefined และเร่ง includes ด้วย Set
  const { perms = [] } = useAuth() as { perms?: string[] };
  const permSet = useMemo(() => new Set(perms ?? []), [perms]);
  const has = useCallback(
    (p: string) => permSet.has("admin:all") || permSet.has(p),
    [permSet]
  );

  // (debug ชั่วคราว) ลองดูค่าที่ได้จาก useAuth
  // useEffect(() => { console.log("[Sidebar perms]", perms); }, [perms]);

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
    { key: "/home", label: "หน้าแรก", icon: <HomeOutlined /> },
    { key: "/request", label: "รีเควสเกม", icon: <SendOutlined /> },
    { key: "/category/Community", label: "ชุมชน", icon: <TeamOutlined /> },
    { key: "/category/Payment", label: "การชำระเงิน", icon: <DollarOutlined /> },
    { key: "/workshop", label: "Workshop", icon: <ToolOutlined /> },
    { key: "/refund", label: "การคืนเงินผู้ใช้", icon: <RetweetOutlined /> },
    { key: "/report", label: "รายงานปัญหา", icon: <FlagOutlined /> },
  ];

  if (has("admin:panel")) {
    const children: ItemType[] = [];
    if (has("admin:game")) children.push({ key: "/information/Add", label: "เพิ่มเกม", icon: <PlusOutlined /> });
    if (has("admin:request")) children.push({ key: "/requestinfo", label: "ข้อมูลรีเควส", icon: <PlusOutlined /> });
    if (has("admin:promotion")) children.push({ key: "/promotion", label: "Promotion", icon: <PlusOutlined /> });
    if (has("admin:page")) children.push({ key: "/Admin/Page", label: adminPageLabel, icon: <PlusOutlined /> });
    if (has("admin:paymentreview")) children.push({ key: "/Admin/PaymentReviewPage", label: "PaymentReview", icon: <PlusOutlined /> });
    if (has("admin:role")) children.push({ key: "/Admin/RolePage", label: "Role", icon: <PlusOutlined /> });

    if (children.length > 0) {
      items.push({ key: "/Admin", label: "Admin", children });
    } else {
      // ⬇️ (ออปชัน) แสดงหัวข้อ Admin ไว้ก่อน ถ้าคุณมีหน้า /Admin เป็น Dashboard
      // ถ้าไม่มีหน้า /Admin ให้ลบบล็อกนี้ทิ้ง เพื่อคงพฤติกรรมเดิม
      items.push({ key: "/Admin", label: "Admin" });
    }
  }

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

      <Layout style={{ background: "#0f0f0f" }}>
        <Content style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
