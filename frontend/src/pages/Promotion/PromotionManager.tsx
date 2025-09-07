import { useEffect, useMemo, useState } from "react";
import {
  Layout, Card, Form, Input, InputNumber, DatePicker, Switch,
  Button, Space, Table, Tag, Popconfirm, message, Typography, Select,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import type { Promotion, GameLite } from "../Promotion/App.ts";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type FormValues = {
  title: string;
  description?: string;
  discountPercent: number;
  active: boolean;
  dateRange: [Dayjs, Dayjs];
  gameIds: string[];
  imageUrl?: string;
};

export default function PromotionManager() {
  const [form] = Form.useForm<FormValues>();
  const [data, setData] = useState<Promotion[]>([]);
  const [games, setGames] = useState<GameLite[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEdit = useMemo(() => Boolean(editingId), [editingId]);

  const normalizePromo = (p: any): Promotion => ({
    id: String(p.id ?? p.ID),
    title: p.title,
    description: p.description,
    discountPercent: p.discountPercent ?? p.discount_value ?? 0,
    startDate: p.startDate ?? p.start_date,
    endDate: p.endDate ?? p.end_date,
    active: p.active ?? p.status,
    imageUrl: p.imageUrl ?? p.promo_image,
    gameIds: (p.gameIds ?? p.games?.map((g: any) => String(g.id ?? g.ID))) || [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          fetch("http://localhost:8088/games"),
          fetch("http://localhost:8088/promotions?with=games"),
        ]);
        const gameJson = await gRes.json();
        const promoJson = await pRes.json();
        setGames(gameJson.map((g: any) => ({ id: String(g.id ?? g.ID), title: g.title })));
        setData(promoJson.map((p: any) => normalizePromo(p)));
      } catch {
        message.error("โหลดข้อมูลล้มเหลว");
      }
    };
    load();
  }, []);

  const gameOptions = useMemo(
    () => games.map(g => ({ label: g.title, value: g.id })),
    [games]
  );

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const body = {
        title: values.title,
        description: values.description,
        discount_type: "PERCENT",
        discount_value: values.discountPercent,
        start_date: values.dateRange[0].toISOString(),
        end_date: values.dateRange[1].toISOString(),
        status: values.active,
        promo_image: values.imageUrl,
        game_ids: values.gameIds.map(id => Number(id)),
      };
      const res = await fetch(
        `http://localhost:8088/promotions${isEdit ? `/${editingId}` : ""}`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error("api error");
      const saved = normalizePromo(await res.json());
      setData(prev => (
        isEdit ? prev.map(p => (p.id === saved.id ? saved : p)) : [...prev, saved]
      ));
      message.success(isEdit ? "อัปเดตแล้ว" : "สร้างแล้ว");
      form.resetFields();
      setEditingId(null);
    } catch {
      message.error("บันทึกไม่สำเร็จ");
    }
  };

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8088/promotions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("api error");
      setData(prev => prev.filter(p => p.id !== id));
      message.success("ลบแล้ว");
    } catch {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const columns = [
    { title: "ชื่อโปรโมชัน", dataIndex: "title", key: "title",
      render: (t: string) => <Text style={{ color: "white" }}>{t}</Text> },
    { title: "% ลด", dataIndex: "discountPercent", key: "discountPercent",
      render: (n: number) => <Tag color="magenta">{n}%</Tag> },
    { title: "ช่วงเวลา", key: "date",
      render: (_: any, r: Promotion) => (
        <Text style={{ color: "#ccc" }}>
          {dayjs(r.startDate).format("YYYY-MM-DD")} → {dayjs(r.endDate).format("YYYY-MM-DD")}
        </Text>
      ) },
    { title: "สถานะ", dataIndex: "active", key: "active",
      render: (a: boolean) => a ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
    { title: "เกมที่ร่วม", key: "games",
      render: (_: any, r: Promotion) => (
        <div>
          {r.gameIds.map(id => {
            const title = games.find(g => g.id === id)?.title || id;
            return <Tag key={id}>{title}</Tag>;
          })}
        </div>
      ) },
    { title: "จัดการ", key: "actions",
      render: (_: any, r: Promotion) => (
        <Space>
          <Button onClick={() => {
            setEditingId(r.id);
            form.setFieldsValue({
              title: r.title,
              description: r.description,
              discountPercent: r.discountPercent,
              dateRange: [dayjs(r.startDate), dayjs(r.endDate)],
              active: r.active,
              gameIds: r.gameIds,
              imageUrl: r.imageUrl,
            });
          }}>แก้ไข</Button>
          <Popconfirm
            title="ลบโปรโมชันนี้?"
            okText="ลบ" cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(r.id)}
          >
            <Button danger>ลบ</Button>
          </Popconfirm>
        </Space>
      ) },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
     
      <Content style={{ padding: 24, background: "#141414" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Title level={2} style={{ color: "white" }}>Promotion Manager</Title>

          <Card style={{ marginBottom: 16, background: "#1f1f1f", color: "white", borderRadius: 10 }}>
            <Form<FormValues> layout="vertical" form={form} requiredMark="optional"
              initialValues={{
                active: true,
                dateRange: [dayjs(), dayjs().add(7, "day")]
              }}
            >
              <Form.Item name="title" label={<span style={{ color: "#ccc" }}>ชื่อโปรโมชัน</span>}
                rules={[{ required: true, message: "กรอกชื่อโปรโมชัน" }]}
              >
                <Input placeholder="เช่น Mid-Year Sale" />
              </Form.Item>

              <Form.Item name="description" label={<span style={{ color: "#ccc" }}>รายละเอียด</span>}>
                <Input.TextArea rows={3} placeholder="รายละเอียดโปรโมชัน" />
              </Form.Item>

              <Form.Item name="discountPercent" label={<span style={{ color: "#ccc" }}>% ส่วนลด</span>}
                rules={[{ required: true, message: "กรอก % ส่วนลด" }]}
              >
                <InputNumber min={0} max={100} style={{ width: 160 }} />
              </Form.Item>

              <Form.Item name="dateRange" label={<span style={{ color: "#ccc" }}>ช่วงเวลา</span>}
                rules={[{ required: true, message: "เลือกช่วงเวลา" }]}
              >
                <RangePicker />
              </Form.Item>

              <Form.Item name="active" label={<span style={{ color: "#ccc" }}>สถานะ</span>} valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item name="gameIds" label={<span style={{ color: "#ccc" }}>เกมที่ร่วมรายการ</span>}>
                <Select mode="multiple" placeholder="เลือกเกม" options={gameOptions} style={{ maxWidth: 600 }} />
              </Form.Item>

              <Form.Item name="imageUrl" label={<span style={{ color: "#ccc" }}>รูปภาพ (URL)</span>}>
                <Input placeholder="เช่น https://…" />
              </Form.Item>

              <Space>
                <Button type="primary" onClick={onSubmit}>
                  {isEdit ? "บันทึกการแก้ไข" : "สร้างโปรโมชัน"}
                </Button>
                <Button onClick={() => { form.resetFields(); setEditingId(null); }}>
                  ล้างฟอร์ม
                </Button>
              </Space>
            </Form>
          </Card>

          <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}>
            <Table rowKey="id" columns={columns as any} dataSource={data} pagination={{ pageSize: 8 }} />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
