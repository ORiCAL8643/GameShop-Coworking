import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Input, Table, Typography, Space, Dropdown, Popconfirm,
  message, Spin, Card, ConfigProvider, theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { UserOutlined, EditOutlined, MoreOutlined, SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;
const API_URL = "http://localhost:8088";

interface User { ID: number; }
interface Role {
  ID: number;
  title: string;
  description?: string;   // <— มีในโมเดล แต่จะไม่แสดงในตาราง
  color?: string;
  users?: User[];
  member_count?: number;
}

const RoleManagement: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Role[]>(`${API_URL}/roles`);
      const list = res.data || [];
      setRoles(list);

      const baseCounts: Record<number, number> = {};
      const needFetch: number[] = [];
      list.forEach((r) => {
        if (typeof r.member_count === "number") baseCounts[r.ID] = r.member_count!;
        else if (Array.isArray(r.users)) baseCounts[r.ID] = r.users!.length;
        else needFetch.push(r.ID);
      });
      setMemberCounts(baseCounts);

      if (needFetch.length) {
        const detail = await Promise.all(needFetch.map((rid) => axios.get<Role>(`${API_URL}/roles/${rid}`)));
        const add: Record<number, number> = {};
        detail.forEach((d) => {
          const role = d.data;
          add[role.ID] = typeof role.member_count === "number" ? role.member_count! : (role.users || []).length;
        });
        setMemberCounts((prev) => ({ ...prev, ...add }));
      }
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || "โหลดรายการบทบาทไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleDeleteRole = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/roles/${id}`);
      setRoles((prev) => prev.filter((r) => r.ID !== id));
      setMemberCounts((prev) => { const c = { ...prev }; delete c[id]; return c; });
      message.success("ลบบทบาทเรียบร้อยแล้ว");
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || "ลบบทบาทไม่สำเร็จ");
    }
  };

// เพิ่ม helper หา default ชื่อที่ไม่ซ้ำ
const makeUniqueRoleName = (base: string, existing: Role[]) => {
  const names = new Set(existing.map(r => (r.title || "").trim().toLowerCase()));
  if (!names.has(base.toLowerCase())) return base;
  let i = 2;
  while (names.has(`${base} (${i})`.toLowerCase())) i++;
  return `${base} (${i})`;
};

const handleAddRole = async () => {
  try {
    const base = "ตำแหน่งใหม่";
    const uniqueTitle = makeUniqueRoleName(base, roles);

    const res = await axios.post<Role>(`${API_URL}/roles`, {
      title: uniqueTitle,
      description: "",
      color: "#faad14",
    });

    setRoles((prev) => [...prev, res.data]);
    setMemberCounts((prev) => ({ ...prev, [res.data.ID]: 0 }));
    navigate(`/roles/${res.data.ID}`);
    message.success("สร้างบทบาทใหม่เรียบร้อย");
  } catch (err: any) {
    console.error(err);
    message.error(err?.response?.data?.error || "สร้างบทบาทไม่สำเร็จ");
  }
};


  const filtered = useMemo(
    () => roles.filter((r) => (r.title || "").toLowerCase().includes(search.toLowerCase())),
    [roles, search]
  );

  const columns: ColumnsType<Role> = [
    {
      title: "บทบาท",
      dataIndex: "title",
      key: "title",
      render: (_: string, record: Role) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-block", width: 10, height: 10, borderRadius: 999,
              background: record.color || "#1890ff", boxShadow: "0 0 0 2px rgba(255,255,255,0.06)",
            }}
          />
          <span style={{ color: "white", fontWeight: 600 }}>{record.title}</span>
        </div>
      ),
    },
    {
      title: "สมาชิก",
      key: "members",
      width: 140,
      render: (_: unknown, record: Role) => (
        <Space>
          <UserOutlined />
          <span style={{ color: "white", fontVariantNumeric: "tabular-nums" }}>
            {memberCounts[record.ID] ?? 0}
          </span>
        </Space>
      ),
    },
    {
      title: "",
      key: "edit",
      width: 64,
      render: (_: unknown, record: Role) => (
        <Button shape="circle" icon={<EditOutlined />} onClick={() => navigate(`/roles/${record.ID}`)} />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 64,
      render: (_: unknown, record: Role) => {
        const items: MenuProps["items"] = [
          {
            key: "delete",
            label: (
              <Popconfirm
                title="คุณแน่ใจหรือไม่ที่จะลบบทบาทนี้?"
                okText="ลบ"
                cancelText="ยกเลิก"
                onConfirm={() => handleDeleteRole(record.ID)}
              >
                <span style={{ color: "red" }}>ลบ</span>
              </Popconfirm>
            ),
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgBase: "#141414",
          colorBgContainer: "#1f1f1f",
          colorText: "#ffffff",
          colorBorder: "#2b2b2b",
          borderRadius: 10,
        },
      }}
    >
      <div style={{ background: "#141414", minHeight: "100vh", flex:1 }}>
        <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <Title level={3} style={{ color: "white", margin: 0, flex: 1 }}>
              บทบาท
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRole}>
              สร้างบทบาทใหม่
            </Button>
          </div>

          <Card style={{ background: "#1f1f1f", borderColor: "#2b2b2b" }} bodyStyle={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="ค้นหาบทบาท"
                style={{ maxWidth: 420 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </div>

            <Spin spinning={loading}>
              <Table<Role>
                rowKey="ID"
                columns={columns}
                dataSource={filtered}
                pagination={false}
                size="middle"
                style={{ background: "transparent" }}
              />
            </Spin>

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", color: "#9aa0a6", padding: "28px 8px 8px" }}>
                ไม่พบบทบาทที่ค้นหา
              </div>
            )}
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default RoleManagement;