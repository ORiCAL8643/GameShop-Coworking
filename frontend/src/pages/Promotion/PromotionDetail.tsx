import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout, Typography, Card, Tag, Button, Empty, Row, Col } from "antd";
import Sidebar from "../../components/Sidebar";
import GameCard from "../../components/GameCard";
import type { Promotion } from "../../interfaces/Promotion";
import type { Game } from "../../interfaces/Game";
import { getPromotion } from "../../services/promotions";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;

const base_url = import.meta.env.VITE_API_URL || "http://localhost:8088";

function applyDiscount(
  price: number,
  type: Promotion["discount_type"],
  value: number,
): number {
  if (value <= 0) return price;
  switch (type) {
    case "PERCENT":
      return price * (1 - value / 100);
    case "AMOUNT":
      return price < value ? 0 : price - value;
    default:
      return price;
  }
}

export default function PromotionDetail() {
  const { id } = useParams<{ id: string }>();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await getPromotion(Number(id), true);
        setPromotion(data);
        if (data.games) {
          setGames(
            data.games.map((g: any) => ({
              ...g,
              discounted_price: applyDiscount(
                g.base_price,
                data.discount_type,
                data.discount_value,
              ),
            })),
          );
        }
      } catch {
        setPromotion(null);
      }
    };
    load();
  }, [id]);

  if (!promotion) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
        <Sidebar />
        <Content style={{ padding: 24, background: "#141414" }}>
          <Empty description="ไม่พบโปรโมชัน" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      
      <Content style={{ padding: 24, background: "#141414" }}>
        {promotion.promo_image && (
          <img
            src={resolveImgUrl(promotion.promo_image)}
            alt={promotion.title}
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
              display: "block",
              borderRadius: 50,
              marginBottom: 40,
            }}
          />
        )}
        <div style={{ maxWidth: 2000, margin: "0 auto" }}>

          <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10, marginBottom: 16 }}>
            <Title level={3} style={{ color: "white", margin: 0 }}>
              {promotion.title}
            </Title>
            <div style={{ marginTop: 8 }}>
              <Tag>
                {dayjs(promotion.start_date).format("YYYY-MM-DD")} → {dayjs(promotion.end_date).format("YYYY-MM-DD")}
              </Tag>
            </div>
            {promotion.description && (
              <div style={{ color: "#ccc", marginTop: 8 }}>{promotion.description}</div>
            )}
          </Card>

          <Card title={<span style={{ color: "white" }}>เกมที่ร่วมรายการ</span>}
            headStyle={{ background: "#1f1f1f", color: "white" }}
            bodyStyle={{ background: "#141414" }}
            style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}
          >
            {games.length > 0 ? (
              <Row gutter={[16, 16]}>
                {games.map((g) => (
                  <Col key={g.ID} xs={24} sm={12} md={8} lg={6}>
                    <GameCard
                      game={g}
                      imgSrc={resolveImgUrl(g.img_src)}
                      onBuy={() => navigate(`/game/${g.ID}`)}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Text style={{ color: "#888" }}>ยังไม่มีเกม</Text>
            )}
            <div style={{ marginTop: 12 }}>
              <Link to="/promotions">
                <Button>ย้อนกลับ</Button>
              </Link>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
