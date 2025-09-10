import { Layout, Space, Typography } from "antd";
import Sidebar from "../../components/Sidebar";
import ProductGrid from "../../components/ProductGrid"; // ใช้คอมโพเนนต์ที่มีอยู่จริง
import { useAuth } from "../../context/AuthContext";

const { Content } = Layout;
const { Title } = Typography;

const Mygame = () => {
  const { id } = useAuth();
  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      {/* Sidebar ทางซ้าย */}
      <Sidebar />

      {/* เนื้อหาหลัก */}
      <Content style={{ background: "#141414" }}>
        <div style={{ padding: 16 }}>
          <div
            style={{
              background: "linear-gradient(90deg, #9254de 0%, #f759ab 100%)",
              height: 180,
              borderRadius: 10,
              marginBottom: 24,
            }}
          />
          <Title level={3} style={{ color: "white" }}>
            My Games
          </Title>

          <Space style={{ marginBottom: 16 }}>
            {/* ปุ่มฟิลเตอร์อื่น ๆ (UI เท่านั้น) */}
          </Space>

          {/* UI-only: แสดงกริดเกมจากคอมโพเนนต์ที่มีอยู่แล้ว */}
          <ProductGrid id={id} />
        </div>
      </Content>
    </Layout>
  );
};

export default Mygame;
