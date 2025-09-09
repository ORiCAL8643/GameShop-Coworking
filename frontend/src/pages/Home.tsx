import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import { Button, Space, Typography } from "antd";
import { useAuth } from "../context/AuthContext";

const { Title } = Typography;

const Home = () => {
  const { id } = useAuth();
  return (
    <div style={{ background: '#141414', flex: 1 , minHeight: '100vh'}}>
      <Navbar />
      <div style={{ padding: '16px' }}>
        <div style={{ background: 'linear-gradient(90deg, #9254de 0%, #f759ab 100%)', height: 180, borderRadius: 10, marginBottom: 24, flex: 1}}></div>
        <Title level={3} style={{ color: 'white' }}>Product</Title>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" shape="round">Top</Button>
          <Button shape="round">Popular</Button>
          <Button shape="round">Recommended</Button>
          <Button shape="round">Filter</Button>
        </Space>
        <ProductGrid userId={id} />
      </div>
    </div>
  );
};

export default Home;
