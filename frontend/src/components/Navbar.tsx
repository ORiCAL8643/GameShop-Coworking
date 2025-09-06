import { Input, Avatar, Space } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, BellOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#1f1f1f' }}>
      {/* Search */}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search"
        style={{ width: '50%', borderRadius: 8, background: '#2f2f2f', color: 'white' }}
      />

      {/* Icons */}
      <Space size="large">
        <BellOutlined style={{ color: 'white', fontSize: '18px' }} />

        {/* Refund Status Icon */}
        <Link to="/refund-status">
          <DollarCircleOutlined style={{ color: '#4CAF50', fontSize: '20px' }} />
        </Link>

        <ShoppingCartOutlined style={{ color: 'white', fontSize: '18px' }} />
        <Avatar src="https://i.pravatar.cc/300" />
      </Space>
    </div>
  );
};

export default Navbar;
