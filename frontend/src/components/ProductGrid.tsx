import { Row, Col } from 'antd';
import AddProductCard from './AddProductCard';
import { Link } from 'react-router-dom';
import { Card, Button } from 'antd';
import { useState,useEffect } from 'react';
import axios from 'axios';

const base_url = 'http://localhost:8088'

const ProductGrid = () => {
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

  const[game, Setgame] = useState<Game[]>([])
  async function GetGame() {
        try {
        const response = await axios.get(`${base_url}/game`)
        Setgame(response.data)
        console.log(response.data)
        } catch(err) {
        console.log('get game error',err)
        }  
}
    useEffect(() =>{
        GetGame()
    }, [])

  return (
    <Row gutter={[16, 16]}> 
      {game.map((c) => ( 
        <Col xs={24} sm={12} md={8} lg={6} >
          <Card
          style={{ background: '#1f1f1f', color: 'white', borderRadius: 10 }}
          cover={ <img src={resolveImgUrl(c.img_src)} style={{height: 150}}/>}
        >
        <Card.Meta title={<div style={{color: '#ffffffff'}}>{c.game_name}</div>} description={<div style={{color: '#ffffffff'}}>{c.categories.title}</div>}/>
          <div style={{ marginTop: 10, color: '#9254de' }}>{c.base_price}</div>
          <Button block style={{ marginTop: 10 }}>Add to Cart</Button>
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
