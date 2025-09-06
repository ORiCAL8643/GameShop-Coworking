// src/pages/PromotionDetail.tsx
import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout, Typography, Card, Tag, List, Button, Empty } from "antd";
import Sidebar from "../components/Sidebar";
import { getById } from "../services/promotionsApi";
import { listGames } from "../services/gamesApi";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function PromotionDetail() {
  const { id } = useParams<{ id: string }>();
  const promotion = useMemo(() => (id ? getById(id) : undefined), [id]);

  const games = useMemo(() => {
    if (!promotion) return [];
    const all = listGames();
    return all.filter(g => promotion.gameIds?.includes(g.id));
  }, [promotion]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      <Sidebar />
      <Content style={{ background: "#141414" }}>
        {!promotion ? (
          <div style={{ padding: 24 }}>
            <Empty description={<span style={{ color: "#bbb" }}>Promotion not found</span>} />
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {/* Banner */}
            {promotion.imageUrl && (
              <div
                style={{
                  height: 240,
                  borderRadius: 12,
                  backgroundImage: `url(${promotion.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  marginBottom: 16,
                }}
              />
            )}

            {/* Head */}
            <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10, marginBottom: 16 }}>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                {promotion.title}
              </Title>
              <div style={{ marginTop: 8 }}>
                <Tag color="magenta" style={{ marginRight: 8 }}>
                  {promotion.discountPercent}% OFF
                </Tag>
                {(promotion.startDate || promotion.endDate) && (
                  <Tag color="geekblue">
                    {promotion.startDate ? dayjs(promotion.startDate).format("YYYY-MM-DD") : "now"} →{" "}
                    {promotion.endDate ? dayjs(promotion.endDate).format("YYYY-MM-DD") : "open"}
                  </Tag>
                )}
                <Tag color={promotion.active ? "green" : ""}>{promotion.active ? "Active" : "Inactive"}</Tag>
              </div>
              {promotion.description && (
                <Text style={{ color: "rgba(255,255,255,0.85)" }}>{promotion.description}</Text>
              )}
            </Card>

            {/* Games in this promotion */}
            <Card
              title={<span style={{ color: "white" }}>Games in this promotion</span>}
              headStyle={{ background: "#1f1f1f" }}
              bodyStyle={{ background: "#141414" }}
              style={{ background: "#1f1f1f", borderRadius: 10 }}
            >
              {!games.length ? (
                <Empty description={<span style={{ color: "#bbb" }}>No games selected</span>} />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={games}
                  renderItem={(g: any) => (
                    <List.Item
                      actions={[
                        <Link key="view" to={`/gamedetail/${g.id}`}>
                          <Button type="link">View</Button>
                        </Link>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<span style={{ color: "white" }}>{g.title}</span>}
                        description={g.genre ? <span style={{ color: "#bbb" }}>{g.genre}</span> : null}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </div>
        )}
      </Content>
    </Layout>
  );
}
