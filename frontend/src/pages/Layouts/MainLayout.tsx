// src/layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import Sidebar from "../../components/Sidebar";


const { Content } = Layout;

export default function MainLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Content style={{ padding: "20px", background: "#0f0c29" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
