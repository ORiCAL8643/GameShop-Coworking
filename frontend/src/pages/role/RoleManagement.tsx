import React, { useState } from "react";
import {
  Button,
  Input,
  Table,
  Typography,
  Space,
  Card,
  Dropdown,
  Popconfirm,
  message,
} from "antd";
import { UserOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const RoleManagement: React.FC = () => {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([
    {
      key: "1",
      role: "Admin",
      members: 1,
      icon: <UserOutlined style={{ color: "#1890ff" }} />,
    },
    {
      key: "2",
      role: "User",
      members: 2,
      icon: <UserOutlined style={{ color: "#52c41a" }} />,
    },
  ]);

  const handleDeleteRole = (key: string) => {
    setRoles((prev) => prev.filter((r) => r.key !== key));
    message.success("ลบบทบาทเรียบร้อยแล้ว");
  };

  const handleAddRole = () => {
    const newRole = {
      key: Date.now().toString(),
      role: "ตำแหน่งใหม่",
      members: 0,
      icon: <UserOutlined style={{ color: "#faad14" }} />,
    };

    setRoles((prev) => {
      const everyone = prev.find((r) => r.key === "everyone");
      const others = prev.filter((r) => r.key !== "everyone");
      return [...others, newRole, everyone!];
    });

    navigate(`/roles/${newRole.key}`);
  };

  const columns = [
    {
      title: "บทบาท",
      dataIndex: "role",
      key: "role",
      render: (text: string, record: any) => (
        <Space>
          {record.icon}
          {text}
        </Space>
      ),
    },
    {
      title: "สมาชิก",
      dataIndex: "members",
      key: "members",
      render: (count: number) => (
        <Space>
          <UserOutlined />
          {count}
        </Space>
      ),
    },
    {
      title: "",
      key: "edit",
      render: (_: any, record: any) => (
        <Button
          shape="circle"
          icon={<EditOutlined />}
          style={{ border: "none" }}
          onClick={() => navigate(`/roles/${record.key}`)}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: any) => {
        // 🔒 ห้ามลบ role @everyone
        if (record.key === "everyone") return null;

        const items = [
          {
            key: "delete",
            label: (
              <Popconfirm
                title="คุณแน่ใจหรือไม่ที่จะลบบทบาทนี้?"
                okText="ลบ"
                cancelText="ยกเลิก"
                onConfirm={() => handleDeleteRole(record.key)}
              >
                <span style={{ color: "red" }}> ลบ</span>
              </Popconfirm>
            ),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button
              shape="circle"
              icon={<MoreOutlined />}
              style={{ border: "none" }}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ background: "#141414", minHeight: "100vh" }}>
      <div style={{ padding: "16px", maxWidth: "600px" }}>
        <Title level={3} style={{ color: "white" }}>
          บทบาท
        </Title>
        
        <Space style={{ marginBottom: 16 }}>
          <Input.Search placeholder="ค้นหาบทบาท" style={{ width: 430 }} />
          <Button type="primary" shape="round" onClick={handleAddRole}>
            สร้างบทบาทใหม่
          </Button>
        </Space>
        <Table
          columns={columns}
          dataSource={roles}
          pagination={false}
          style={{
            background: "#1f1f1f",
            borderRadius: 8,
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
};

export default RoleManagement;
