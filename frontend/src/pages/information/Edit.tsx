
import { Layout } from 'antd';
import Navbar from "../../components/Navbar";
import { Typography, } from "antd";
import { Col, Row, Space } from 'antd';
import {Input, Button} from 'antd';
import {
  PlusOutlined  ,
} from '@ant-design/icons';

const { Title } = Typography;


const Edit = () => {
    return(
        <Layout>
            <Layout style={{ background: '#141414', flex: 1 , minHeight: '100vh'}}>
                <div style={{ padding: '10px' }}>
                    <Navbar />
                    <div style={{ background: 'linear-gradient(90deg, #9254de 0%, #f759ab 100%)', height: 180, borderRadius: 10, marginBottom: 24 }}></div>
                    <Title level={3} style={{ color: 'white' }}>Edit</Title> {/* title ต้อง import Typography*/}
                    <Row style={{marginBottom: 24 }}>
                        <Col span={12}>
                            <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>ชื่อ</text></Space>
                            <br />
                            <br />
                            <Input placeholder="กรุณากรอกชื่อเกม" style={{ width: 500}}/>
                            <br />
                            <br />
                            <br />
                            <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>คะแนน</text></Space>
                            <br />
                            <br />
                            <Space><Input  style={{ width: 50}}/><text style={{ color: '#d6d6d6ff' }}>/10</text></Space>
                            <br />
                            <br />
                            <br />
                            <Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>หมวดหมู่</text></Space>
                            <br />
                            <br />
                            <Input placeholder="กรุณากรอกหมวดหมู่" style={{ width: 500}}/>
                        </Col>
                        <Col span={12}><img src="https://fanatical.imgix.net/product/original/34684a05-a18d-4eaa-91e1-c7529d7ed1bd.jpg?auto=compress,format&w=870&fit=crop&h=489" width={"750px"} height={"300px"}></img></Col>
                    </Row>
                    <Row>
                        <Col span={12}><Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>รีวิว</text></Space></Col>
                        <Col span={12}><Space><PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>Minimum Spec</text></Space></Col>
                    </Row>
                    <Row style={{marginTop: 12}}>
                        <Col span={12}>
                            <Layout style={{ background: '#ffc18fff', height: 500, borderRadius: 10, marginRight: 24}} >
                            </Layout>
                        </Col>
                        <Col span={12}>
                            <Layout style={{ background: '#ffc18fff', height: 500, borderRadius: 10, marginBottom: 24}} >
                                <Row style={{marginLeft: 24, marginTop: 24}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>OS</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Processor</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Memory</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Graphics</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}}/>
                                </Row>
                                <Row style={{marginLeft: 24, marginBottom: 24, marginTop: 12}}>
                                    <Col span={12}><Space><PlusOutlined  style={{background: '#ffc18fff', color: '#000000ff'}}/><text style={{ color: '#000000ff' }}>Storage</text></Space></Col>
                                    <br />
                                    <br />
                                    <Input placeholder="-" style={{ width: 500}}/>
                                </Row>
                            </Layout>
                            <PlusOutlined  style={{background: '#141414', color: '#d6d6d6ff'}}/><text style={{ color: '#d6d6d6ff' }}>Reward</text>
                            <Layout style={{ background: '#ffc18fff', height: 500, borderRadius: 10, marginTop: 12}} >
                                
                            </Layout>
                        </Col>
                    </Row>
                    <Row style={{marginTop: 12}}>
                        <Col offset={23}><Button type="primary">ยืนยัน</Button></Col>
                    </Row>
                </div>
            </Layout>
        </Layout>
    );
}

export default Edit;