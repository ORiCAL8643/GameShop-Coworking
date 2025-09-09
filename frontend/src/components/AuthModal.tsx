import { useState } from "react";
import { Modal, Form, Input, Button, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type LoginValues = { username: string; password: string };
type SignupValues = {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday: dayjs.Dayjs;
};

const API_URL = "http://localhost:8088";

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  // message API (indicator กลางจอด้านบน)
  const [messageApi, contextHolder] = message.useMessage();

  // สถานะโหลดสำหรับแต่ละฟอร์ม
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // สำหรับควบคุม/เติมค่า Form
  const [loginForm] = Form.useForm<LoginValues>();
  const [signupForm] = Form.useForm<SignupValues>();

  const toggleMode = () => setIsLogin((v) => !v);

  const handleLogin = async (values: LoginValues) => {
    const key = "auth-login";
    try {
      setLoginLoading(true);
      messageApi.open({ key, type: "loading", content: "กำลังเข้าสู่ระบบ...", duration: 0 });

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => "");
        throw new Error(errTxt || "Login failed");
      }

      const data = await res.json();
      // เก็บ token ผ่าน AuthContext
      login(data.token, values.username);

      messageApi.open({ key, type: "success", content: "เข้าสู่ระบบสำเร็จ", duration: 4.0 });
      onClose();
      loginForm.resetFields();
    } catch (error: any) {
      messageApi.open({
        key,
        type: "error",
        content: error?.message || "เข้าสู่ระบบไม่สำเร็จ",
        duration: 4.0,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (values: SignupValues) => {
    const key = "auth-signup";
    try {
      setSignupLoading(true);
      messageApi.open({ key, type: "loading", content: "กำลังสมัครสมาชิก...", duration: 0 });

      const payload = {
        username: values.username,
        password: values.password,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        birthday: values.birthday?.format("YYYY-MM-DD"),
      };

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => "");
        throw new Error(errTxt || "Signup failed");
      }

      // สมัครสำเร็จ: แจ้งเตือน + เด้งไปหน้า Login (ไม่ auto login ตามที่ต้องการ)
      messageApi.open({ key, type: "success", content: "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ", duration: 2.5 });

      // เติม username ให้ฟอร์ม Login เพื่อความสะดวก
      loginForm.setFieldsValue({
        username: values.username,
        password: "", // ให้ผู้ใช้กรอกรหัสผ่านอีกครั้งเอง
      });

      // เคลียร์ฟอร์มสมัคร & สลับไปหน้า Login
      signupForm.resetFields();
      setIsLogin(true);
    } catch (error: any) {
      messageApi.open({
        key,
        type: "error",
        content: error?.message || "สมัครสมาชิกไม่สำเร็จ",
        duration: 2.5,
      });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered destroyOnClose>
      {/* ให้ message ทำงานใน modal นี้ */}
      {contextHolder}

      {isLogin ? (
        <>
          <h2 style={{ textAlign: "center", marginBottom: 24 }}>Login</h2>
          <Form<LoginValues> form={loginForm} layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please enter your username" }]}
            >
              <Input autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loginLoading}>
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
          <h2 style={{ textAlign: "center", marginBottom: 24 }}>Sign Up</h2>
          <Form<SignupValues> form={signupForm} layout="vertical" onFinish={handleSignup}>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please enter your username" }]}
            >
              <Input autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}
            >
              <Input autoComplete="email" />
            </Form.Item>

            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true, message: "Please enter your first name" }]}
            >
              <Input autoComplete="given-name" />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="last_name"
              rules={[{ required: true, message: "Please enter your last name" }]}
            >
              <Input autoComplete="family-name" />
            </Form.Item>

            <Form.Item
              label="Birthday"
              name="birthday"
              rules={[{ required: true, message: "Please select your birthday" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={signupLoading}>
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
