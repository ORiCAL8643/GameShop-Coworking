import { Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import { Card, Button, Modal, message } from "antd";
import { useState, useEffect } from "react";
import axios from "axios";
import { MoreOutlined } from "@ant-design/icons";

const base_url = "http://localhost:8088";

interface ProductGridProps {
  userId: number | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({ userId }) => {
  interface Game {
    ID: number;
    game_name: string;
    key_id: number;
    categories: { ID: number; title: string } | null;
    release_date: string;
    base_price: number;
    /** Price after applying promotion. Undefined when no promotion */
    discounted_price?: number;
    img_src: string;
    age_rating: number;
    status: string;
    minimum_spec_id: number;
  }

  // แปลง img_src ให้เป็น absolute URL เสมอ
  const resolveImgUrl = (src?: string) => {
    if (!src) return "";
    if (src.startsWith("data:image/")) return src;
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    const clean = src.startsWith("/") ? src.slice(1) : src;
    return `${base_url}/${clean}`;
  };

  const [games, setGames] = useState<Game[]>([]);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Game | null>(null);
  const open = !!selected;

  const showModal = (e: React.MouseEvent, item: Game) => {
    e.stopPropagation(); // กันไม่ให้คลิกการ์ดแล้วเด้งไปหน้า detail
    setSelected(item);
  };
  const handleCancel = () => setSelected(null);

  async function fetchGames() {
    try {
      const response = await axios.get(`${base_url}/game`);
      setGames(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log("get game error", err);
      setGames([]);
    }
  }
  useEffect(() => {
    fetchGames();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, g: Game) => {
    e.stopPropagation(); // กันคลิกการ์ด
    try {
      if (!userId) {
        message.warning("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า");
        navigate("/login");
        return;
      }
      const price = g.discounted_price ?? g.base_price;
      const res = await axios.post(`${base_url}/orders`, {
        user_id: Number(userId),
        total_amount: price,
        order_status: "PENDING",
        order_items: [
          {
            unit_price: price,
            qty: 1,
            game_key_id: g.key_id,
          },
        ],
      });
      const orderId = res.data.ID || res.data.id;
      if (orderId) {
        localStorage.setItem("orderId", String(orderId));
      }
      navigate("/category/Payment");
    } catch (err) {
      console.error("add to cart error", err);
      message.error("ไม่สามารถเพิ่มลงตะกร้าได้");
    }
  };

  const goDetail = (g: Game) => {
    const gid = g?.ID ?? (g as any)?.id;
    if (gid) navigate(`/game/${gid}`);
  };

  const approveGames = games.filter((g) => g.status === "approve");

  return (
    <Row gutter={[16, 16]}>
      {approveGames.map((c) => {
        const hasDiscount =
          c.discounted_price !== undefined && c.discounted_price < c.base_price;

        return (
          <Col xs={24} sm={12} md={8} lg={6} key={c.ID}>
            <Card
              hoverable
              onClick={() => goDetail(c)}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && goDetail(c)}
              style={{
                background: "#1f1f1f",
                color: "white",
                borderRadius: 10,
                cursor: "pointer",
              }}
              cover={
                <img
                  src={resolveImgUrl(c.img_src)}
                  alt={c.game_name}
                  style={{ height: 180, objectFit: "cover" }}
                />
              }
            >
              <Row align="top">
                <Col span={21}>
                  <Card.Meta
                    title={<div style={{ color: "#fff" }}>{c.game_name}</div>}
                    description={
                      <div style={{ color: "#fff" }}>
                        {c.categories?.title ?? "-"}
                      </div>
                    }
                  />
                </Col>
                <Col span={3} style={{ textAlign: "right" }}>
                  <Button
                    onClick={(e) => showModal(e, c)}
                    type="text"
                    shape="circle"
                    size="small"
                    style={{ background: "#1f1f1f" }}
                    icon={
                      <MoreOutlined style={{ fontSize: "18px", color: "#fff" }} />
                    }
                  />
                  <Modal
                    title={selected?.game_name}
                    open={open}
                    onCancel={handleCancel}
                    onOk={handleCancel}
                    okText="ปิด"
                    closable
                  >
                    <p>หมวดหมู่: {selected?.categories?.title ?? "-"}</p>
                    <p>วันวางขาย: {selected?.release_date ?? "-"}</p>
                    <p>อายุขั้นต่ำ: {selected?.age_rating ?? "-"}</p>
                  </Modal>
                </Col>
              </Row>

              <div style={{ marginTop: 10, color: "#9254de" }}>
                {hasDiscount ? (
                  <>
                    <span
                      style={{ textDecoration: "line-through", color: "#ccc" }}
                    >
                      {c.base_price.toLocaleString()}
                    </span>
                    <span style={{ marginLeft: 8 }}>
                      {c.discounted_price!.toLocaleString()}
                    </span>
                  </>
                ) : (
                  c.base_price.toLocaleString()
                )}
              </div>

              <Button
                block
                style={{ marginTop: 10 }}
                onClick={(e) => handleAddToCart(e, c)}
              >
                Add to Cart
              </Button>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default ProductGrid;
