import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout, Typography, Card, Tag, List, Button, Empty } from "antd";
import Sidebar from "../../components/Sidebar";
import type { Promotion, GameLite } from "../Promotion/App.ts";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;

// mock เฉพาะ UI
const MOCK_GAMES: GameLite[] = [
  { id: "g1", title: "Elden Ring" },
  { id: "g2", title: "Baldur’s Gate 3" },
];
const MOCK_PROMOS: Promotion[] = [
  {
    id: "p1",
    title: "Mid-Year Sale",
    description: "ลดจัดหนักหลายเกมดัง",
    discountPercent: 30,
    startDate: dayjs().subtract(7, "day").toISOString(),
    endDate: dayjs().add(7, "day").toISOString(),
    active: true,
    imageUrl: "https://picsum.photos/1200/400?blur=2",
    gameIds: ["g1", "g2"],
  },
];

export default function PromotionDetail() {
  const { id } = useParams<{ id: string }>();
  const promotion = useMemo(() => MOCK_PROMOS.find(p => p.id === id), [id]);

  const games = useMemo(() => {
    return promotion ? MOCK_GAMES.filter(g => promotion.gameIds.includes(g.id)) : [];
  }, [promotion]);

  if (!promotion) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
        <Sidebar />
        <Content style={{ padding: 24, background: "#141414" }}>
          <Empty description="ไม่พบโปรโมชัน (UI)" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      <Sidebar />
      <Content style={{ padding: 24, background: "#141414" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {promotion.imageUrl && (
            <div
              style={{
                width: "100%", height: 220, borderRadius: 10,
                backgroundImage: `url(${promotion.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                marginBottom: 16,
              }}
            />
          )}

          <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10, marginBottom: 16 }}>
            <Title level={3} style={{ color: "white", margin: 0 }}>
              {promotion.title}
            </Title>
            <div style={{ marginTop: 8 }}>
              <Tag color="magenta" style={{ marginRight: 8 }}>
                -{promotion.discountPercent}%
              </Tag>
              <Tag>
                {dayjs(promotion.startDate).format("YYYY-MM-DD")} → {dayjs(promotion.endDate).format("YYYY-MM-DD")}
              </Tag>
              {promotion.active ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>}
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
            <List
              dataSource={games}
              locale={{ emptyText: <Text style={{ color: "#888" }}>ยังไม่มีเกม</Text> }}
              renderItem={(g) => (
                <List.Item actions={[<Button key="buy">ไปหน้าซื้อ</Button>]}>
                  <List.Item.Meta
                    title={<Text style={{ color: "white" }}>{g.title}</Text>}
                    description={<Text style={{ color: "#aaa" }}>Game ID: {g.id}</Text>}
                  />
                </List.Item>
              )}
            />
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
