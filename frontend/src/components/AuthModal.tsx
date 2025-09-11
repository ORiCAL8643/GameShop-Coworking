import { useState } from 'react';
import { Modal, Form, Input, Button, DatePicker } from 'antd';
import { useAuth } from '../context/AuthContext';
import type { Notification } from '../interfaces/Notification';

// ✅ ตั้งค่า API URL ไว้ที่เดียว
const API_URL = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:8088';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: (notif: Notification) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const toggleMode = () => setIsLogin(!isLogin);

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      const text = await res.text();
      let result: any = {};
      try { result = text ? JSON.parse(text) : {}; } catch {}

      if (!res.ok) {
        Modal.error({ title: 'เข้าสู่ระบบไม่สำเร็จ', content: result?.error || result?.detail || text || 'Login failed' });
        return;
      }

      login(result.id, result.token, result.username ?? values.username);
      const notification = {
        ID: Date.now(),
        title: 'ระบบ',
        type: 'system',
        message: 'เข้าสู่ระบบสำเร็จ',
        created_at: new Date().toLocaleString(),
        is_read: false,
      } as Notification;
      onLoginSuccess?.(notification);
      onClose();
    } catch (error) {
      Modal.error({ title: 'เกิดข้อผิดพลาด', content: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์' });
      console.log('เกิดข้อผิดพลาดไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', error);
    }
  };

  // ✅ เปลี่ยนไปเรียก /register (public) + โชว์ error จาก backend ให้ชัด
  const handleSignup = async (values: any) => {
    try {
      const payload = {
        username: values.username?.trim(),
        password: values.password,
        email: values.email?.trim(),
        first_name: values.first_name?.trim(),     // ไม่บังคับ ฝั่ง BE จะไม่ error แม้ไม่รองรับก็จะเมิน
        last_name: values.last_name?.trim(),
        // ถ้าจะให้ BE เก็บวันเกิดจริง แนะนำส่งเป็น ISO; ตอนนี้ BE จะเมิน field นี้ (ไม่พัง)
        birthday: values.birthday ? values.birthday.toISOString() : undefined,
      };

      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!res.ok) {
        Modal.error({
          title: 'สมัครสมาชิกไม่สำเร็จ',
          content: data?.error || data?.detail || text || `Signup failed (${res.status} ${res.statusText})`,
        });
        return;
      }

      // ✅ สมัครสำเร็จ → ล็อกอินทันที
      const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: values.username, password: values.password }),
      });
      const loginText = await loginRes.text();
      let loginData: any = {};
      try { loginData = loginText ? JSON.parse(loginText) : {}; } catch {}

      if (!loginRes.ok) {
        Modal.error({ title: 'เข้าสู่ระบบหลังสมัครไม่สำเร็จ', content: loginData?.error || loginData?.detail || loginText || 'Login failed' });
        return;
      }

      login(loginData.id, loginData.token, loginData.username ?? values.username);
      onClose();
    } catch (error) {
      console.error(error);
      Modal.error({ title: 'เกิดข้อผิดพลาด', content: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์' });
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered>
      {isLogin ? (
        <>
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Login</h2>
          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Login
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" onClick={toggleMode} block>
                Don't have an account? Sign Up
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        <>
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Sign Up</h2>
          <Form layout="vertical" onFinish={handleSignup}>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true, message: 'Please enter your first name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="last_name"
              rules={[{ required: true, message: 'Please enter your last name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Birthday"
              name="birthday"
              rules={[{ required: true, message: 'Please select your birthday' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Sign Up
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" onClick={toggleMode} block>
                Already have an account? Login
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default AuthModal;
