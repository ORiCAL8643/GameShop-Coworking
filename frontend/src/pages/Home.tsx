import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import { useAuth } from "../context/AuthContext";
import { Button, Space, Typography, Carousel } from "antd";
import type { Promotion } from "../interfaces/Promotion";
import { listPromotions } from "../services/promotions";

const { Title } = Typography;
const base_url = import.meta.env.VITE_API_URL || "http://localhost:8088";

const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("blob:")) return "";
  if (src.startsWith("data:image/")) return src;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  const clean = src.startsWith("/") ? src.slice(1) : src;
  return `${base_url}/${clean}`;
};

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

  const promotionsWithImages = promotions.filter((promo) => promo.promo_image);

  return (
    <div style={{ background: '#141414', flex: 1, minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '16px' }}>
        {promotionsWithImages.length > 0 && (
          promotionsWithImages.length > 1 ? (
            <Carousel autoplay style={{ marginBottom: 24 }}>
              {promotionsWithImages.map((promo) => (
                <div
                  key={promo.ID}
                  onClick={() => navigate(`/promotion/${promo.ID}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={resolveImgUrl(promo.promo_image)}
                    alt={promo.title}
                    style={{
                      height: 180,
                      width: '100%',
                      objectFit: 'cover',
                      borderRadius: 10,
                    }}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <div
              onClick={() => navigate(`/promotion/${promotionsWithImages[0].ID}`)}
              style={{ cursor: 'pointer', marginBottom: 24 }}
            >
              <img
                src={resolveImgUrl(promotionsWithImages[0].promo_image)}
                alt={promotionsWithImages[0].title}
                style={{
                  height: 180,
                  width: '100%',
                  objectFit: 'cover',
                  borderRadius: 10,
                }}
              />
            </div>
          )
        )}
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
