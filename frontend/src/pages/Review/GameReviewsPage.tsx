// src/pages/GameReviewsPage.tsx
import { Layout, Card, Button, Typography } from "antd";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ReviewList from "../components/ReviewList";

const { Content } = Layout;
const { Title } = Typography;

export default function GameReviewsPage() {
  const { id: gameId } = useParams<{ id: string }>();

  if (!gameId) return null;

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      <Sidebar />
      <Content style={{ background: "#141414" }}>
        <div style={{ padding: 16 }}>
          <Card
            style={{ background: "#1f1f1f", color: "white", borderRadius: 10, marginBottom: 16 }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                All Reviews
              </Title>
              <Link to={`/game/${gameId}/review/new`}>
                <Button type="primary">เขียนรีวิว</Button>
              </Link>
            </div>
          </Card>

          <Card
            title={<span style={{ color: "white" }}>Reviews</span>}
            headStyle={{ background: "#1f1f1f" }}
            bodyStyle={{ background: "#141414" }}
            style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}
          >
            <ReviewList gameId={gameId} />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
