import { Row, Col } from 'antd';
import AddProductCard from './AddProductCard';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';

const base_url = 'http://localhost:8088';

interface ProductGridProps {
  userId: number | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({ userId }) => {
  interface Game {
      ID: number;
      game_name: string;
      key_id: number;
      categories: {ID: number, title: string};
      release_date: string;
      base_price: number;
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
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:")) {
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
      Setgame(response.data);
      console.log(response.data);
    } catch (err) {
      console.log('get game error', err);
    }
  }
  useEffect(() => {
    GetGame();
  }, []);

  const handleAddToCart = async (g: Game) => {
    try {
      // 1) ตรวจสอบว่ามี orderId ใน localStorage หรือไม่
      let orderId = localStorage.getItem('orderId');

      // 2) ถ้ามี orderId ให้ตรวจสอบว่าออเดอร์ยังมีอยู่หรือไม่
      if (orderId) {
        try {
          await axios.get(`${base_url}/orders/${orderId}`);
        } catch (error) {
          if (
            axios.isAxiosError(error) &&
            (error.response?.status === 404 || error.response?.status === 400)
          ) {
            // ถ้าออเดอร์ไม่พบหรือไม่ถูกต้อง ให้ลบ orderId และสร้างใหม่
            localStorage.removeItem('orderId');
            orderId = null;
          } else {
            throw error;
          }
        }
      }

      // 3) ถ้ายังไม่มี ให้สร้างออเดอร์ใหม่แล้วเก็บ orderId
      if (!orderId) {
        const orderRes = await axios.post(`${base_url}/orders`, {
          user_id: userId,
          total_amount: 0,
          order_status: 'PENDING',
        });
        orderId = String(orderRes.data.ID || orderRes.data.id);
        localStorage.setItem('orderId', orderId);
      }

      // 4) เพิ่มสินค้าเข้า order_items ของออเดอร์
      await axios.post(`${base_url}/order-items`, {
        order_id: Number(orderId),
        unit_price: g.base_price,
        qty: 1,
        line_discount: 0,
        line_total: g.base_price,
        game_key_id: g.key_id,
      });

      // 5) อัปเดตราคารวมของออเดอร์หลังเพิ่มสินค้า
      const current = await axios.get(`${base_url}/orders/${orderId}`);
      const currentTotal = current.data.total_amount || 0;
      await axios.put(`${base_url}/orders/${orderId}`, {
        total_amount: currentTotal + g.base_price,
      });

      // นำผู้ใช้ไปหน้า Payment พร้อมเลขออเดอร์
      navigate(`/category/Payment?id=${orderId}`);
    } catch (err) {
      console.error('add to cart error', err);
    }
  };

  const approveGames = game.filter(game => game.status === "approve");
  return (
    <Row gutter={[16, 16]}> 
      {approveGames.map((c) => ( 
        <Col xs={24} sm={12} md={8} lg={6} >
          <Card
          style={{ background: '#1f1f1f', color: 'white', borderRadius: 10 }}
          cover={ <img src={resolveImgUrl(c.img_src)} style={{height: 150}}/>}
        >
        <Card.Meta title={<div style={{color: '#ffffffff'}}>{c.game_name}</div>} description={<div style={{color: '#ffffffff'}}>{c.categories.title}</div>}/>
          <div style={{ marginTop: 10, color: '#9254de' }}>{c.base_price}</div>
          <Button
            block
            style={{ marginTop: 10 }}
            onClick={() => handleAddToCart(c)}
          >
            Add to Cart
          </Button>
          </Card>
        </Col>
      ))
      }
      <Col xs={24} sm={12} md={8} lg={6}>
        <Link to={'/information/Add'}>
          <AddProductCard />
        </Link>
      </Col>
    </Row>
  );
};

export default ProductGrid;
