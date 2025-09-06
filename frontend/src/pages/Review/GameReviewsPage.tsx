import { Layout, Card, Button, Typography, List, Rate, Space, Empty } from "antd";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import type { Review } from "../Promotion/App.ts";

const { Content } = Layout;
const { Title, Text } = Typography;

// mock data เฉพาะ UI
const MOCK_REVIEWS: Review[] = [
  { id: "r1", gameId: "g1", title: "สนุกมาก ระบบดี", rating: 4.5, text: "เล่นเพลิน บอสท้าทาย", user: "Alice", createdAt: new Date().toISOString() },
  { id: "r2", gameId: "g1", title: "ยากไปนิด", rating: 3, text: "มือใหม่อาจหัวร้อน แต่โดยรวมโอเค", user: "Bob", createdAt: new Date().toISOString() },
];

export default function GameReviewsPage() {
  const { id: gameId } = useParams<{ id: string }>();
  const reviews = MOCK_REVIEWS.filter(r => r.gameId === gameId);

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      <Sidebar />
      <Content style={{ padding: 24, background: "#141414" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
            <Title level={2} style={{ color: "white", margin: 0 }}>Reviews</Title>
            <Link to={`/reviews/${gameId}/create`}>
              <Button type="primary">เขียนรีวิว</Button>
            </Link>
          </Space>

          <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}>
            {reviews.length === 0 ? (
              <Empty description={<Text style={{ color: "#888" }}>ยังไม่มีรีวิว</Text>} />
            ) : (
              <List
                dataSource={reviews}
                renderItem={(r) => (
                  <List.Item actions={[ <Link key="edit" to={`/reviews/${r.gameId}/edit/${r.id}`}>แก้ไข</Link> ]}>
                    <List.Item.Meta
                      title={<Text style={{ color: "white" }}>{r.title}</Text>}
                      description={
                        <div style={{ color: "#ccc" }}>
                          <Rate value={r.rating} allowHalf disabled />
                          <div style={{ marginTop: 6 }}>{r.text}</div>
                          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                            โดย {r.user} • {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
