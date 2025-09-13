import { Row, Col, Card, Button, Modal, message } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";

const base_url = "http://localhost:8088";

interface ProductGridProps {
  /** ส่งมาเมื่ออยากใช้โฟลว์ backend order (จะ POST /orders) */
  userId?: number | null;
}

interface Game {
  ID: number;
  game_name: string;
  key_id: number;
  categories: { ID: number; title: string } | null;
  release_date: string;
  base_price: number;
  discounted_price?: number;
  img_src: string;
  age_rating: number | string;
  status: string;
  minimum_spec_id: number;
  minimum_spec: { ID: number; os: string; processor: string; memory: string; graphics: string; storage: string};
}

// แปลง img_src ให้เป็น absolute URL เสมอ
const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("data:image/") || src.startsWith("http") || src.startsWith("blob:")) return src;
  const clean = src.startsWith("/") ? src.slice(1) : src;
  return `${base_url}/${clean}`;
};

const ProductGrid: React.FC<ProductGridProps> = ({ userId = null }) => {
  const [games, setGames] = useState<Game[]>([]);
  const { addItem } = useCart();
  const [selected, setSelected] = useState<Game | null>(null);
  const open = !!selected;

  const navigate = useNavigate();

  const fetchGames = async () => {
    try {
      const res = await axios.get(`${base_url}/game`);
      setGames(Array.isArray(res.data) ? (res.data as Game[]) : []);
    } catch (err) {
      console.error("fetch games error:", err);
      message.error("โหลดรายการเกมไม่สำเร็จ");
      setGames([]);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const goDetail = (g: Game) => {
    const gid = g?.ID ?? (g as any)?.id;
    if (gid) navigate(`/game/${gid}`);
  };

  // ฟังก์ชันรวม: หากมี userId → ยิง backend; ถ้าไม่มีก็ใช้ useCart()
  const handleAddToCart = async (e: React.MouseEvent, g: Game) => {
    e.stopPropagation(); // กันคลิกการ์ด
    const price = Number(g.discounted_price ?? g.base_price) || 0;

    try {
      if (userId) {
        // โฟลว์ backend (เหมือนโค้ดก่อนหน้า)
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

        const orderId = res?.data?.ID ?? res?.data?.id;
        if (orderId) {
          localStorage.setItem("orderId", String(orderId));
        }
        message.success(`สร้างออเดอร์และเพิ่ม ${g.game_name} ลงตะกร้าแล้ว`);
      } else {
        // โฟลว์ตะกร้า local (useCart)
        addItem({ id: g.ID, title: g.game_name, price, quantity: 1 });
        message.success(`เพิ่ม ${g.game_name} ลงตะกร้าแล้ว`);
      }

      navigate("/category/Payment");
    } catch (err) {
      console.error("add to cart error:", err);
      message.error("ไม่สามารถเพิ่มลงตะกร้าได้");
    }
  };
  const approveGames = games.filter((g) => g.status === "approve");

  return (
    <Row gutter={[16, 16]}>
      {approveGames.map((c) => {
        const hasDiscount =
          typeof c.discounted_price === "number" &&
          c.discounted_price > 0 &&
          c.discounted_price < c.base_price;

        return (
          <Col key={c.ID} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => goDetail(c)}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && goDetail(c)}
              style={{ background: "#1f1f1f", color: "white", borderRadius: 10, cursor: "pointer" }}
              cover={
                <img
                  src={resolveImgUrl(c.img_src)}
                  alt={c.game_name}
                  style={{ height: 150, objectFit: "cover" }}
                />
              }
            >
              <Row align="top">
                <Col span={21}>
                  <Card.Meta
                    title={<div style={{ color: "#fff" }}>{c.game_name}</div>}
                    description={
                      <div style={{ color: "#fff" }}>{c.categories?.title ?? "-"}</div>
                    }
                  />
                </Col>
                <Col span={3} style={{ textAlign: "right" }}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(c);
                    }}
                    type="text"
                    shape="circle"
                    size="small"
                    style={{ background: "#1f1f1f" }}
                    icon={<MoreOutlined style={{ fontSize: 18, color: "#fff" }} />}
                  />
                </Col>
              </Row>

              <div style={{ marginTop: 10, color: "#9254de" }}>
                {hasDiscount ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#ccc" }}>
                      {c.base_price.toLocaleString()}
                    </span>
                    <span style={{ marginLeft: 8 }}>{c.discounted_price!.toLocaleString()}</span>
                  </>
                ) : (
                  c.base_price.toLocaleString()
                )}
              </div>

              <Button block style={{ marginTop: 10 }} onClick={(e) => handleAddToCart(e, c)}>
                Add to Cart
              </Button>
            </Card>
          </Col>
        );
      })}

      <Modal
        title={selected?.game_name}
        open={open}
        onCancel={() => setSelected(null)}
        onOk={() => setSelected(null)}
        okText="ปิด"
        closable
        afterClose={() => setSelected(null)}
      >
        <p>หมวดหมู่: {selected?.categories?.title ?? "-"}</p>
        <p>วันวางขาย: {selected?.release_date ?? "-"}</p>
        <p>อายุขั้นต่ำ: {selected?.age_rating ?? "-"}</p>
        <p>os: {selected?.minimum_spec?.os}</p>
        <p>processor: {selected?.minimum_spec?.processor?? "-"}</p>
        <p>memory: {selected?.minimum_spec?.memory?? "-"}</p>
        <p>graphics: {selected?.minimum_spec?.graphics?? "-"}</p>
        <p>Storage: {selected?.minimum_spec?.storage?? "-"}</p>
      </Modal>
    </Row>
  );
};

export default ProductGrid;
