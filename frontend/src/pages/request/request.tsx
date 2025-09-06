import { Layout, Space, Button } from 'antd';
import Navbar from "../../components/Navbar";
import { Typography, Input, DatePicker } from "antd";
import { Col, Row } from 'antd';

import {
  PlusOutlined  ,
} from '@ant-design/icons';

const { Title } = Typography;

const Request = () => {

    return(
        <Layout>
            <Layout style={{ background: '#141414', flex: 1 , minHeight: '100vh'}}>
                <div style={{ padding: '10px' }}>
                    <Navbar />
                    <div style={{ background: 'linear-gradient(90deg, #9254de 0%, #f759ab 100%)', height: 180, borderRadius: 10, marginBottom: 24 }}></div>
                    <Title level={3} style={{ color: 'white' }}>Request</Title> {/* title ต้อง import Typography*/}
                    <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>ชื่อ</text></Space>
                    <br />
                    <br />
                    <Input placeholder="กรุณากรอกชื่อเกม" style={{ width: 500}}/>
                    <br />
                    <br />
                    <br />
                    <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>เหตุผล</text></Space>
                    <br />
                    <br />
                    <Input placeholder="กรุณากรอกเหตุผล" style={{ width: 500}}/>
                    <br />
                    <br />
                    <br />
                    <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>ว/ด/ป</text></Space>
                    <br />
                    <br />
                    <DatePicker />
                    <br />
                    <br />
                    <br />
                    <Row>
                        <Col offset={12}><Button type="primary">ยืนยัน</Button></Col>
                    </Row>
                </div>
            </Layout>
        </Layout>
    );
};


export default Request;