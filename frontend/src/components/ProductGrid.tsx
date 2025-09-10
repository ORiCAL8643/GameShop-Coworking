import { Row, Col, Card, Button, message, Tag } from "antd";
import { useState, useEffect } from "react";
import axios from "axios";

const base_url = "http://localhost:8088";

interface ProductGridProps {
  userId: number | null;
}

interface Game {
  ID: number;
  game_name: string;
  key_id: number;
  categories: { ID: number; title: string };
  release_date: string;
  base_price: number;
  /** ราคาหลังหักโปร หากไม่มีโปรจะเป็น undefined */
  discounted_price?: number;
  img_src: string;
  age_rating: number;
  status: string; // "approve" แล้วเท่านั้นที่ขายได้
  minimum_spec_id: number;
}

/** แปลง img_src ให้กลายเป็น absolute URL เสมอ */
const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("data:image/")) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  // กันเคส blob: ที่ใช้จากหน้าอื่นมา – ไม่ควรใช้ต่อ
  if (src.startsWith("blob:")) return "";
  // เคสส่งมาเป็น uploads/xxx หรือ /uploads/xxx
  const clean = src.startsWith("/") ? src.slice(1) : src;
  return `${base_url}/${clean}`;
};

/** เก็บ order แยกตามผู้ใช้ เพื่อลดโอกาสหยิบ order คนอื่นผิด */
const getOrderKey = (uid: number) => `orderId:${uid}`;

const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(
    n
  );

const ProductGrid: React.FC<ProductGridProps> = ({ userId }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function fetchGames() {
    try {
      const res = await axios.get(`${base_url}/game`);
      setGames(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("get game error", err);
      message.error("ดึงรายการเกมไม่สำเร็จ");
    }
  }

  useEffect(() => {
    fetchGames();
  }, []);

  /**
   * เพิ่มเกมลงตะกร้า:
   * - ต้องมี userId (เพื่อผูกออเดอร์กับเจ้าของบัญชี)
   * - ใช้ราคา discounted_price ถ้ามี ไม่งั้นใช้ base_price
   * - สร้างออเดอร์ครั้งแรกแล้วจำ orderId ใน localStorage แยกตาม user
   * - เพิ่มได้หลายเกม (หลายบรรทัด) ไปผูกกับออเดอร์เดียวกัน
   */
  const handleAddToCart = async (g: Game) => {
    if (!userId) {
      message.warning("กรุณาเข้าสู่ระบบก่อนเพิ่มเกมลงตะกร้า");
      return;
    }

    setLoadingId(g.ID);
    try {
      const price = g.discounted_price ?? g.base_price;
      const lineDiscount = g.base_price - price;

      // ดึง/สร้าง orderId ที่เป็นของ userId คนนี้เท่านั้น
      let orderId = localStorage.getItem(getOrderKey(userId || 0));

      // ถ้ายังไม่มีออเดอร์ -> สร้างใหม่
      if (!orderId) {
        const createOrderRes = await axios.post(`${base_url}/orders`, {
          user_id: userId,
          order_status: "PENDING",
        });
        orderId = String(createOrderRes.data.ID || createOrderRes.data.id);
        localStorage.setItem(getOrderKey(userId), orderId);
      }

      // เพิ่มรายการเกม 1 ชิ้นลงออเดอร์เดิม (เพิ่มได้เรื่อยๆ ทีละเกม)
      await axios.post(`${base_url}/order-items`, {
        unit_price: g.base_price,
        qty: 1,
        order_id: Number(orderId),
        game_key_id: g.key_id,
        // ฟิลด์ช่วยคิดราคาแถว (ถ้า backend รองรับ เก็บไปด้วย)
        line_discount: lineDiscount,
        line_total: price,
      });

      message.success("เพิ่มเกมลงตะกร้าสำเร็จ");
    } catch (err) {
      console.error("add to cart error", err);
      message.error("ไม่สามารถเพิ่มเกมลงตะกร้าได้");
    } finally {
      setLoadingId(null);
    }
  };

  const approveGames = games.filter((g) => g.status === "approve");

  return (
    <Row gutter={[16, 16]}>
      {approveGames.map((c) => {
        const hasDiscount =
          c.discounted_price !== undefined && c.discounted_price < c.base_price;
        const cover = resolveImgUrl(c.img_src);

        return (
          <Col key={c.ID} xs={24} sm={12} md={8} lg={6}>
            <Card
              style={{
                background: "#1f1f1f",
                color: "white",
                borderRadius: 10,
                border: "1px solid #2b2f3a",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
              cover={
                cover ? (
                  <img
                    src={cover}
                    alt={c.game_name}
                    style={{ height: 180, objectFit: "cover" }}
                  />
                ) : undefined
              }
            >
              <Card.Meta
                title={
                  <div style={{ color: "#fff", display: "flex", gap: 8 }}>
                    <span>{c.game_name}</span>
                    <Tag color="purple" style={{ marginLeft: "auto" }}>
                      {c.categories?.title}
                    </Tag>
                  </div>
                }
                description={
                  <div style={{ color: "#a9afc3" }}>
                    อายุ {c.age_rating}+ • วางขาย {new Date(c.release_date).toLocaleDateString("th-TH")}
                  </div>
                }
              />

              <div style={{ marginTop: 12, color: "#9254de", fontSize: 16 }}>
                {hasDiscount ? (
                  <>
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "#bbb",
                        marginRight: 8,
                      }}
                    >
                      {formatTHB(c.base_price)}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {formatTHB(c.discounted_price!)}
                    </span>
                    <Tag style={{ marginLeft: 8 }} color="green">
                      -{formatTHB(c.base_price - (c.discounted_price || c.base_price))}
                    </Tag>
                  </>
                ) : (
                  <span style={{ fontWeight: 600 }}>
                    {formatTHB(c.base_price)}
                  </span>
                )}
              </div>

              <Button
                block
                style={{ marginTop: 12 }}
                loading={loadingId === c.ID}
                onClick={() => handleAddToCart(c)}
              >
                เพิ่มลงตะกร้า
              </Button>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default ProductGrid;
