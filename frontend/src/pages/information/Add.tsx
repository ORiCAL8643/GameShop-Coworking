import { Select, Layout } from 'antd';
import Navbar from "../../components/Navbar";
import { Typography, } from "antd";
import { Col, Row, Space } from 'antd';
import {Input, Button} from 'antd';
import { Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
const { Title } = Typography;
import { useState,useEffect } from 'react';
import axios from 'axios';

const base_url = 'http://localhost:8088'
const Add = () => {
    interface Category {
        ID: number;
        title: string;
} 
    const [categories,setcategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [gameName, setGameName] = useState("");
    const [price, setPrice] = useState<number | null>(null);
    const [age, setAge] = useState<number | null>(null);
    const [imgurl, setImageurl] = useState("https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small_2x/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg");
    const [os, setOs] = useState("");
    const [m_id,setM_id]=useState<number>(1);
    const [processor, setProcessor] = useState("");
    const [memory, setMemory] = useState("");
    const [graphics, setGraphics] = useState("");
    const [storage, setStorage] = useState("");
    /*
    const handleChange = ({ fileList }: { fileList: UploadFile[] }) => {
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj as File | undefined;
      if (file) {
        const url = URL.createObjectURL(file); // แปลงเป็น URL
        setImageurl(url);
      }
    } else {
      setImageurl(""); // ถ้าลบไฟล์ออกก็เคลียร์ state
    }
  };*/
    const handleChange = ({ fileList }: { fileList: UploadFile[] }) => {
    if (fileList.length === 0) {
        setImageurl("");
        return;
    }
    const file = fileList[0].originFileObj as File | undefined;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const dataUrl = reader.result as string;   // "data:image/png;base64,..."
        setImageurl(dataUrl);                     // ✅ เก็บไว้ส่งไป /new-game
    };
    reader.onerror = (e) => console.error("FileReader error:", e);
    reader.readAsDataURL(file);
};

    async function GetCategories() {
        try {
        const response = await axios.get(`${base_url}/categories`)
        setcategories(response.data)
        console.log(response.data)
        } catch(err) {
        console.log('get categories error',err)
        }  
}
    useEffect(() =>{
        GetCategories()
    }, [])

    async function AddGame() {
        try {
            const response = await axios.post(`${base_url}/new-game`, {
            game_name: gameName,
            base_price: price,
            age_rating: age,
            img_src: imgurl,
            minimum_spec_id: m_id,
            categories_id: categoryId,
        });
            console.log("เพิ่มเกมสำเร็จ:", response.data)
            setM_id(m_id+1)
        } catch(err) {
            console.log("add game error",err)
        }  
} 
    async function AddMinimumSpec() {
        try {
            const response = await axios.post(`${base_url}/new-minimumspec`, {
            os: os,
            processor: processor,
            memory: memory,
            graphics:graphics,
            storage:storage,
        });
            console.log("เพิ่มเกมสเป็ค:", response.data)
        } catch(err) {
            console.log("add spec error",err)
        }  
}
    return(
        <Layout>
            <Layout style={{ background: '#141414', flex: 1 , minHeight: '100vh'}}>
                <div style={{ padding: '10px' }}>
                    <Navbar />
                    <div style={{ background: 'linear-gradient(90deg, #9254de 0%, #f759ab 100%)', height: 180, borderRadius: 10, marginBottom: 24 }}></div>
                    <Title level={3} style={{ color: 'white' }}>Add</Title> {/* title ต้อง import Typography*/}
                    <Row style={{marginBottom: 24 }}>
                        <Col span={12}>
                            <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>ชื่อ</text></Space>
                            <br />
                            <br />
                            <Input placeholder="กรุณากรอกชื่อเกม" style={{ width: 500 }} value={gameName} onChange={(e) => setGameName(e.target.value)}/>
                            <br />
                            <br />
                            <br />
                            <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>ราคา</text></Space>
                            <br />
                            <br />
                            <Input style={{ width: 50 }} onChange={(e) => setPrice(Number(e.target.value))}/>
                            <br />
                            <br />
                            <br />
                            <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>อายุ</text></Space>
                            <br />
                            <br />
                            <Input style={{ width: 50 }} onChange={(e) => setAge(Number(e.target.value))}/>
                            <br />
                            <br />
                            <br />
                            <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>หมวดหมู่</text></Space>
                            <br />
                            <br />
                            <Select placeholder="กรุณากรอกหมวดหมู่" style={{ width: 500 }} options={categories.map(c => ({ value: c.ID, label: c.title }))} value={categoryId ?? undefined} onChange={(val, option) => {console.log("onChange val:", val);console.log("onChange option:", option);setCategoryId(val);}}/>
                        </Col>
                        <Col span={12}>
                            <img src={imgurl} width={"750px"} height={"300px"}/>
                            <br />
                            <br />
                            <Upload onChange={(handleChange)} maxCount={1} beforeUpload={() => false} accept="image/*"/*ไม่อัปโหลดจริง แค่เก็บใน state*/><Button icon={<UploadOutlined />}>Upload</Button></Upload>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}><Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>Minimum Spec</text></Space></Col>
                    </Row>
                    <Row style={{marginTop: 12}}>
                        <Col>
                            <Layout style={{ background: '#ffc18fff', height: 500, borderRadius: 10, marginBottom: 24}} >
                                <Row style={{marginLeft: 24, marginTop: 24}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>OS</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}} value={os} onChange={(e) => setOs(e.target.value)}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Processor</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}} value={processor} onChange={(e) => setProcessor(e.target.value)}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Memory</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}} value={memory} onChange={(e) => setMemory(e.target.value)}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Graphics</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}} value={graphics} onChange={(e) => setGraphics(e.target.value)}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginBottom: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Storage</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}} value={storage} onChange={(e) => setStorage(e.target.value)}/>
                                </Row>
                            </Layout>
                            
                        </Col>
                    </Row>
                    <Row style={{marginTop: 12}}>
                        <Col offset={23}><Button type="primary" onClick={() => {
                            AddMinimumSpec();
                            AddGame(); 
                        }}>ยืนยัน</Button></Col>
                    </Row>
                </div>
            </Layout>
        </Layout>
    );
}

export default Add;