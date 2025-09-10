import { Row, Col, Card, Button, Modal, message } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";

const base_url = "http://localhost:8088";

interface Game {
  ID: number;
  game_name: string;
  key_id: number;
  categories: { ID: number; title: string };
  release_date: string;
  base_price: number;
  discounted_price?: number;
  img_src: string;
  age_rating: number | string;
  status: string;
  minimum_spec_id: number;
}

const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("data:image/") || src.startsWith("http") || src.startsWith("blob:")) return src;
  const clean = src.startsWith("/") ? src.slice(1) : src;
  return `${base_url}/${clean}`;
};

const ProductGrid: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Game | null>(null);
  const open = !!selected;

  const { addItem } = useCart();
  const navigate = useNavigate();

  const fetchGames = async () => {
    try {
      const res = await axios.get(`${base_url}/game`);
      setGames(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      message.error("โหลดรายการเกมไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleAddToCart = (g: Game) => {
    const price = Number(g.discounted_price ?? g.base_price) || 0;
    addItem({ id: g.ID, title: g.game_name, price, quantity: 1 });
    message.success(`เพิ่ม ${g.game_name} ลงตะกร้าแล้ว`);
    navigate("/category/Payment");
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
              style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}
              cover={
                <img
                  src={resolveImgUrl(c.img_src)}
                  alt={c.game_name}
                  style={{ height: 150, objectFit: "cover" }}
                />
              }
            >
              <Row>
                <Col span={21}>
                  <Card.Meta
                    title={<div style={{ color: "#fff" }}>{c.game_name}</div>}
                    description={<div style={{ color: "#fff" }}>{c.categories?.title ?? "-"}</div>}
                  />
                </Col>
                <Col>
                  <Button
                    onClick={() => setSelected(c)}
                    type="text"
                    shape="circle"
                    size="small"
                    style={{ background: "#1f1f1f" }}
                    icon={<MoreOutlined style={{ fontSize: 18, color: "#fff" }} />}
                  />
                  <Modal
                    title={selected?.game_name}
                    open={open}
                    onCancel={() => setSelected(null)}
                    onOk={() => setSelected(null)}
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
                    <span style={{ textDecoration: "line-through", color: "#ccc" }}>
                      {c.base_price}
                    </span>
                    <span style={{ marginLeft: 8 }}>{c.discounted_price}</span>
                  </>
                ) : (
                  c.base_price
                )}
              </div>

              <Button block style={{ marginTop: 10 }} onClick={() => handleAddToCart(c)}>
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
