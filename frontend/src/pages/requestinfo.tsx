import { Card, Table, Typography, Select, Button } from "antd";
import { Col, Row , Result} from 'antd';
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { useState, useEffect } from "react";
import type { Request } from "../interfaces/Request";
import type { Game } from '../interfaces';
const base_url = 'http://localhost:8088'
const { Title} = Typography;

type Row = {
  id: number;
  game_name: string;
  reason: string;
  user: string;
  date: string; // แสดงเป็นข้อความพอ
};

const columns: ColumnsType<Row> = [
  {
    title: "เกม",
    dataIndex: "game_name",
  },
  { title: "ผู้รีเควส", dataIndex: "user", width: 180, ellipsis: true }, //dataindex อ้างอิงจาก datasource
  { title: "วันที่รีเควส", dataIndex: "date", width: 160 },
  {
    title: "เหตุผล",
    dataIndex: "reason",
    width: 120,
  },
];

export default function Requestinfo() {
  const[Requestinfo, SetRequestinfo] = useState<Request[]>([])
  const[game, Setgame] = useState<Game[]>([])
  const[gameid,SetgameID] = useState<number | null>(null);

  async function UpdateGame(id: number, data: { status?: string }) {
  try {
    const response = await axios.put(`${base_url}/update-game/${id}`, data);
    console.log("อัปเดตสำเร็จ:", response.data);
    return response.data;
  } catch (err) {
    console.error("update error:", err);
  }
}

  async function GetRequest() {
        try {
        const response = await axios.get(`${base_url}/request`)
        SetRequestinfo(response.data)
        console.log(response.data)
        } catch(err) {
        console.log('get game error',err)
        }  
}
    useEffect(() =>{
        GetRequest()
    }, []) //เข้าหน้า info ฟังก์จะเรียกใช้ทันที

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

    const pendingGames = game ? game.filter(g => g.status === "pending") : [];


  return (<div>{(game || pendingGames.length !== 0) ? (
    <div style={{ padding: 16, background:'#141414', minHeight:'100vh'}}>
      <Card
        bodyStyle={{ padding: 20 }}
        style={{ border: "1px solid rgba(255,255,255,0.08)", background:'#3d3d3dff'}}
      >
        <Title level={3} style={{ marginBottom: 12, color:'#fdbcbcff'}}>Request Queue</Title>
        <Table<Row>
          rowKey="id"
          columns={columns}
          dataSource={Requestinfo.map(c => ({
              id: c.ID,
              game_name: c.game_obj.game_name,
              reason: c.reason,
              user: c.user_obj.username,
              date: c.release_date,
}))}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          bordered style={{ background:'#707070ff', borderRadius: 10}}
        />
      </Card>
      <Title level={3} style={{ color: 'white' }}>เลือกเกมขายในหน้าร้านค้า</Title> {/* title ต้อง import Typography*/}
      <Row>
        <Select placeholder="กรุณาเลือกเกม" style={{ width: 500}} options={pendingGames.map(c => ({ value: c.ID, label: c.game_name }))} value={gameid ?? undefined} onChange={(val, option) => {console.log("onChange val:", val);console.log("onChange option:", option);SetgameID(val);}}/>
        <Col offset={1}><Button type="primary" onClick={() => {UpdateGame(gameid,{ status: "approve"})}}>ยืนยัน</Button></Col>
      </Row>
    </div>) : (<Result style={{ flex: 1, background:'#313131ff', justifyContent: "left", minHeight:'100vh', alignItems: "baseline", minWidth:'180vh'}} status={"404"} title={<div style={{color:'#ffffffff'}}>"404"</div>} subTitle={<div style={{color:'#ffffffff'}}>"Sorry, request does not exist."</div>} extra={<Button type="primary" style={{justifyContent: "center", color:'#ffffffff'}}>Back Home</Button>}/>)
  }</div>
  );
}