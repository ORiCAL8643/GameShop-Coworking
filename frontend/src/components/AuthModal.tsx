import { useState } from 'react';
import { Modal, Form, Input, Button, DatePicker } from 'antd';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const toggleMode = () => setIsLogin(!isLogin);

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      const res = await fetch('http://localhost:8088/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data = await res.json();
      login(data.token, values.username);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignup = async (values: any) => {
    try {
      const payload = {
        ...values,
        birthday: values.birthday?.format('YYYY-MM-DD'),
      };

      const res = await fetch('http://localhost:8088/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Signup failed');
      }

      const data = await res.json();
      login(data.token, values.username);
      onClose();
    } catch (error) {
      console.error(error);
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
