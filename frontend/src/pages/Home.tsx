import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import { useAuth } from "../context/AuthContext";
import { Button, Space, Typography } from "antd";
import type { Promotion } from "../interfaces/Promotion";
import { listPromotions } from "../services/promotions";
import PromotionBanner from "../components/PromotionBanner";

const { Title } = Typography;

const Home = () => {
  const { userId } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listPromotions();
        setPromotions(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: '#141414', flex: 1, minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '16px' }}>
        <PromotionBanner
          promotions={promotions}
          onClick={(id) => navigate(`/promotion/${id}`)}
        />
        <Title level={3} style={{ color: 'white' }}>Product</Title>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" shape="round">
            Top
          </Button>
          <Button shape="round">Popular</Button>
          <Button shape="round">Recommended</Button>
          <Button shape="round">Filter</Button>
        </Space>
        <ProductGrid userId={userId} />
      </div>
    </div>
  );
};

export default Home;
