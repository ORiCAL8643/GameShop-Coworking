import { Row, Col, Card, Button, message } from "antd";
//import AddProductCard from "./AddProductCard";
import { useState, useEffect } from "react";
import axios from "axios";

const base_url = "http://localhost:8088";

interface ProductGridProps {
  userId: number | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({ userId }) => {
  interface Game {
    ID: number;
    game_name: string;
    key_id: number;
    categories: { ID: number; title: string };
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
    if (src.startsWith("blob:")) return "";
    if (src.startsWith("data:image/")) return src;
    // ถ้าเป็น blob: เดิม จะมักใช้ไม่ได้ในหน้าอื่น — ควรแก้ฝั่ง backend ให้ส่ง URL ถาวร
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("blob:")
    ) {
      return src;
    }
    // ถ้า backend ส่งเป็น "uploads/xxx.jpg" หรือ "/uploads/xxx.jpg"
    const clean = src.startsWith("/") ? src.slice(1) : src;
    return `${base_url}/${clean}`;
  };

  const [game, Setgame] = useState<Game[]>([]);

  async function GetGame() {
    try {
      const response = await axios.get(`${base_url}/game`);
      Setgame(Array.isArray(response.data) ? response.data : []);
      console.log(response.data);
    } catch (err) {
      console.log("get game error", err);
    }
  }
  useEffect(() => {
    GetGame();
  }, []);

  const handleAddToCart = async (g: Game) => {
    try {
      let orderId = localStorage.getItem("orderId");
      if (!orderId) {
        const res = await axios.post(`${base_url}/orders`, {
          user_id: userId ?? 0,
          order_status: "PENDING",
        });
        orderId = String(res.data.ID || res.data.id);
        localStorage.setItem("orderId", orderId);
      }

      await axios.post(`${base_url}/order-items`, {
        unit_price: g.base_price,
        qty: 1,
        order_id: Number(orderId),
        game_key_id: g.key_id,
      });

      message.success("เพิ่มเกมลงตะกร้าสำเร็จ");
    } catch (err) {
      console.error("add to cart error", err);
      message.error("ไม่สามารถเพิ่มเกมลงตะกร้าได้");
    }
  };

  const approveGames = game.filter((g) => g.status === "approve");
  return (
    <Row gutter={[16, 16]}>
      {approveGames?.map((c) => {
        const hasDiscount =
          c.discounted_price !== undefined && c.discounted_price < c.base_price;
        return (
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              style={{
                background: "#1f1f1f",
                color: "white",
                borderRadius: 10,
              }}
              cover={
                <img src={resolveImgUrl(c.img_src)} style={{ height: 150 }} />
              }
            >
              <Card.Meta
                title={<div style={{ color: "#ffffffff" }}>{c.game_name}</div>}
                description={
                  <div style={{ color: "#ffffffff" }}>{c.categories.title}</div>
                }
              />
              <div style={{ marginTop: 10, color: "#9254de" }}>
                {hasDiscount ? (
                  <>
                    <span
                      style={{ textDecoration: "line-through", color: "#ccc" }}
                    >
                      {c.base_price}
                    </span>
                    <span style={{ marginLeft: 8 }}>{c.discounted_price}</span>
                  </>
                ) : (
                  c.base_price
                )}
              </div>
              <Button
                block
                style={{ marginTop: 10 }}
                onClick={() => handleAddToCart(c)}
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
