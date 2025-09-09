import { Row, Col } from "antd";
//import AddProductCard from "./AddProductCard";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "antd";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const base_url = "http://localhost:8088";

const ProductGrid: React.FC = () => {
  const { id } = useAuth();
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
  const navigate = useNavigate();

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
    if (!id) return; // ต้องเข้าสู่ระบบก่อนสั่งซื้อ
    try {
      const stored = localStorage.getItem("orderId");
      if (!stored) {
        // สร้างออร์เดอร์ใหม่พร้อมรายการแรก
        const res = await axios.post(`${base_url}/orders`, {
          user_id: id,
          total_amount: g.base_price,
          order_status: "PENDING",
          order_items: [
            {
              unit_price: g.base_price,
              qty: 1,
              game_key_id: g.key_id,
            },
          ],
        });
        const newId = res.data.ID || res.data.id;
        if (newId) {
          localStorage.setItem("orderId", String(newId));
          const orderRes = await axios.get(`${base_url}/orders/${newId}`);
          const total = (orderRes.data.order_items || []).reduce(
            (sum: number, it: any) => sum + Number(it.line_total),
            0
          );
          await axios.put(`${base_url}/orders/${newId}`, { total_amount: total });
        }
      } else {
        // เพิ่มรายการเข้าออร์เดอร์เดิม
        await axios.post(`${base_url}/order_items`, {
          order_id: Number(stored),
          game_key_id: g.key_id,
          qty: 1,
          unit_price: g.base_price,
        });
        const orderRes = await axios.get(`${base_url}/orders/${stored}`);
        const total = (orderRes.data.order_items || []).reduce(
          (sum: number, it: any) => sum + Number(it.line_total),
          0
        );
        await axios.put(`${base_url}/orders/${stored}`, { total_amount: total });
      }
      navigate("/category/Payment");
    } catch (err) {
      console.error("add to cart error", err);
    }
  };

  const approveGames = game.filter((g) => g.status === "approve");
  return (
    <Row gutter={[16, 16]}>
      {approveGames?.map((c) => {
        const hasDiscount =
          c.discounted_price !== undefined &&
          c.discounted_price < c.base_price;
        return (
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}
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
