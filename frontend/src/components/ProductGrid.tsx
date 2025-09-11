import { Row, Col } from "antd";
//import AddProductCard from "./AddProductCard";
import { useNavigate } from "react-router-dom";
import { Card, Button, Modal} from "antd";
import { useState, useEffect } from "react";
import axios from "axios";
import { MoreOutlined } from "@ant-design/icons";
import { useCart } from "../context/CartContext";

const base_url = "http://localhost:8088";

interface ProductGridProps {
  userId: number | null;
}

const ProductGrid: React.FC<ProductGridProps> = () => {
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
  type game = {
  id: number;
  game_name: string;
  release_date?: string;
  age_rating?: number | string;
  categories: { title: string };
};

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
  const { addItem } = useCart();
  const [selected, setSelected] = useState<Game | null>(null); //usestate
  const open = !!selected;

  const showModal = (item: Game) => setSelected(item);
  const handleCancel = () => setSelected(null);

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

  const handleAddToCart = (g: Game) => {
    const price = g.discounted_price ?? g.base_price;
    addItem({ id: g.ID, title: g.game_name, price, quantity: 1 });
    navigate("/category/Payment");
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
            <Row>
                <Col span={21}>
                  <Card.Meta
                    title={<div style={{ color: "#ffffffff" }}>{c.game_name}</div>}
                    description={
                      <div style={{ color: "#ffffffff" }}>{c.categories.title}</div>
                    }
                  />
                </Col>
                <Col >
                  <div>
                    <Button onClick={() => showModal(c)} type="text" shape="circle" size="small" style={{background: "#1f1f1f"}} icon={<MoreOutlined style={{fontSize:"18px" , color: "#fffcfcff"}}/>} />
                    <Modal
                        title={selected?.game_name}
                        open={open}
                        onCancel={handleCancel}
                        onOk={handleCancel}
                        okText="ปิด"
                        closable>
                          <p>หมวดหมู่: {selected?.categories.title}</p>
                          <p>วันวางขาย: {selected?.release_date ?? "-"}</p>
                          <p>อายุขั้นต่ำ: {selected?.age_rating ?? "-"}</p>
                    </Modal>
                  </div>
                </Col>
            </Row>
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
