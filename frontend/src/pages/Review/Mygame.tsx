import { Layout, Space, Typography } from "antd";
import Sidebar from "../components/Sidebar";
import ProductGrid from "../components/ProductGrid_mygame";
import ProductGrid_mygame from "../components/ProductGrid_mygame";

const { Content } = Layout;
const { Title } = Typography;

const Mygame = () => {
  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      {/* Sidebar ทางซ้าย */}
      <Sidebar />

      {/* เนื้อหาหลัก */}
      <Content style={{ background: '#141414' }}>
        <div style={{ padding: 16 }}>
          <div
            style={{
              
              background: 'linear-gradient(90deg, #9254de 0%, #f759ab 100%)',
              height: 180,
              borderRadius: 10,
              marginBottom: 24,
            }}
          />
          <Title level={3} style={{ color: 'white' }}>
            My Games
          </Title>

          <Space style={{ marginBottom: 16 }}>
            {/* ปุ่มฟิลเตอร์อื่น ๆ ใส่เพิ่มได้ตามต้องการ */}
          </Space>

          <ProductGrid_mygame />
        </div>
      </Content>
    </Layout>
  );
};

export default Mygame;
