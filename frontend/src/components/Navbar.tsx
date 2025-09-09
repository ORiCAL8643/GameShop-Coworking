
import { SearchOutlined, ShoppingCartOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { Input, Avatar, Space, Button } from 'antd';
import { useAuth } from '../context/AuthContext';

import { Link } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import NotificationsBell from '../components/NotificationsBell';
import type { Notification } from '../interfaces/Notification';
import { fetchNotifications } from '../services/Notification';

const Navbar = () => {
  const [openAuth, setOpenAuth] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token, username, logout, id: userId } = useAuth();

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    const load = async () => {
      try {
        const data = await fetchNotifications(userId);
        setNotifications(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [userId]);

  const handleLoginSuccess: (n: Notification) => void = () => {
    if (userId) {
      fetchNotifications(userId)
        .then(setNotifications)
        .catch((e) => console.error(e));
    }
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
