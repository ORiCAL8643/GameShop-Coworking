
import { SearchOutlined, ShoppingCartOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Input, Avatar, Space, Button } from 'antd';
import { useAuth } from '../context/AuthContext';

import { Link } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import NotificationsBell from '../components/NotificationsBell';
import type { Notification } from '../interfaces/Notification';

const Navbar = () => {
  const [openAuth, setOpenAuth] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token, username, logout } = useAuth();

  const handleLoginSuccess = () => {
    setNotifications((prev) => [
      ...prev,
      {
        ID: Date.now(),
        title: 'Login Successful',
        message: 'You have logged in successfully',
        type: 'system',
        user_id: 0,
      },
    ]);
  };

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
        <NotificationsBell notifications={notifications} />

        {/* Refund Status Icon */}
        <Link to="/refund-status">
          <DollarCircleOutlined style={{ color: '#4CAF50', fontSize: '20px' }} />
        </Link>

        <ShoppingCartOutlined style={{ color: 'white', fontSize: '18px' }} />
        {token ? (
          <>
            <span style={{ color: 'white' }}>{username}</span>
            <Button onClick={logout}>Logout</Button>
            <Avatar src="https://i.pravatar.cc/300" />
          </>
        ) : (
          <Button type="primary" onClick={() => setOpenAuth(true)}>
            Login
          </Button>
        )}
      </Space>
      <AuthModal
        open={openAuth}
        onClose={() => setOpenAuth(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Navbar;
