import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  //HeartOutlined,

  PlusOutlined,

} from '@ant-design/icons';


const { Sider } = Layout;
type groupItem = Required<MenuProps>['items'][number];

const items: groupItem[] = [
  {
    key: '/home' ,
    label: 'หน้าแรก',
  },
  {
    key: '/request',
    label:'รีเควสเกม',
  },
  {
    key: '/requestinfo',
    label:'ข้อมูลรีเควส',
  },
  {
    key: '/information',
    label: 'จัดการข้อมูลเกม',
    children: [
        { key: '/information/Add', label: 'เพิ่มเกม', icon:<PlusOutlined />},
        { key: '/information/Edit', label: 'แก้ไขข้อมูลเกม', icon:<PlusOutlined />},
    ],
  },
  {
    key: '/category',
    label: 'หมวดหมู่',
    children: [
        { key: '/category/Community', label: 'ชุมชน', icon:<PlusOutlined />},
        { key: '/category/Payment', label: 'การชำระเงิน', icon:<PlusOutlined />},
    ],
  },
  {
    key: '/workshop',
    label:'Workshop',
  },
];

const Sidebar = () => {
  const navigate = useNavigate()

  return (
    <Layout>
    <Sider theme="dark" width={220}>
      <div style={{ color: '#9254de', fontSize: 20, textAlign: 'center', padding: '16px 0' }}>
        GAME STORE
      </div>
      <Menu theme="dark"  mode="inline" items={items} onClick={({key})=>{
        navigate(key)
      }}/>
    </Sider>
    <Outlet/>
    </Layout>
  );
};

export default Sidebar;