import { Layout, Space, Button, Select } from 'antd';
import Navbar from "../components/Navbar";
import { Typography, Input, DatePicker } from "antd";
import { Col, Row } from 'antd';
import  axios  from 'axios';
import type { Game } from '../interfaces';
import { useState, useEffect} from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusOutlined  ,
} from '@ant-design/icons';
const base_url = 'http://localhost:8088'
const { Title } = Typography;

const Request = () => {
    const[game, Setgame] = useState<Game[]>([])
    const[gameid,SetgameID] = useState<number | null>(null);
    const[reason, SetReason]=useState("")
    const [date, setDate] = useState<string | null>(null);
    const { id } = useAuth(); //คนใช้งานระบบ
    
    async function CreateRequest() {
        try {
            const response = await axios.post(`${base_url}/new-request`, {
                reason: reason,
                release_date: date,
                user: id,
                game: gameid,
        });
            console.log("เพิ่มรีเควสสำเร็จ:", response.data)
        } catch(err) {
            console.log("add request error",err)
        }  
    }
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

    const pendingGames = game.filter(game => game.status === "pending");
    return(
        <Layout>
            <Layout style={{ background: '#141414', flex: 1 , minHeight: '100vh'}}>
                <Navbar />
                <div style={{ padding: '10px' }}>
                    <div style={{ background: 'linear-gradient(90deg, #9254de 0%, #f759ab 100%)', height: 180, borderRadius: 10, marginBottom: 24 }}></div>
                    <Title level={3} style={{ color: 'white' }}>Request</Title> {/* title ต้อง import Typography*/}
                    <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>ชื่อ</text></Space>
                    <br />
                    <br />
                    <Select placeholder="กรุณาเลือกเกม" style={{ width: 500}} options={pendingGames.map(c => ({ value: c.ID, label: c.game_name }))} value={gameid ?? undefined} onChange={(val, option) => {console.log("onChange val:", val);console.log("onChange option:", option);SetgameID(val);}}/>
                    <br />
                    <br />
                    <br />
                    <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>เหตุผล</text></Space>
                    <br />
                    <br />
                    <Input placeholder="กรุณากรอกเหตุผล" style={{ width: 500}} value={reason} onChange={(e) => SetReason(e.target.value)}/>
                    <br />
                    <br />
                    <br />
                    <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>ว/ด/ป</text></Space>
                    <br />
                    <br />
                    <DatePicker value={date} onChange={(value) => setDate(value)}/>
                    <br />
                    <br />
                    <br />
                    <Row>
                        <Col offset={12}><Button type="primary" onClick={() => {CreateRequest()}}>ยืนยัน</Button></Col>
                    </Row>
                </div>
            </Layout>
        </Layout>
    );
};


export default Request;