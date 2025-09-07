import { useMemo, useState } from "react";
import {
  Layout, Card, Form, Input, InputNumber, DatePicker, Switch,
  Button, Space, Table, Tag, Popconfirm, message, Typography, Select, Upload
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import Sidebar from "../../components/Sidebar";
import type { Promotion, GameLite } from "../Promotion/App.ts";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// mock data เฉพาะ UI
const MOCK_GAMES: GameLite[] = [
  { id: "g1", title: "Elden Ring" },
  { id: "g2", title: "Baldur’s Gate 3" },
];

const MOCK_PROMOS: Promotion[] = [
  {
    id: "p1",
    title: "Mid-Year Sale",
    description: "ลดจัดหนักหลายเกมดัง",
    discountPercent: 30,
    startDate: dayjs().subtract(7, "day").toISOString(),
    endDate: dayjs().add(7, "day").toISOString(),
    active: true,
    imageUrl: "https://picsum.photos/1200/400?grayscale",
    gameIds: ["g1", "g2"],
  },
];

type FormValues = {
  title: string;
  description?: string;
  discountPercent: number;
  active: boolean;
  dateRange: [Dayjs, Dayjs];
  gameIds: string[];
  imageFile?: any;
};

export default function PromotionManager() {
  const [form] = Form.useForm<FormValues>();
  const [data, setData] = useState<Promotion[]>(MOCK_PROMOS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEdit = useMemo(() => Boolean(editingId), [editingId]);

  const gameOptions = useMemo(
    () => MOCK_GAMES.map(g => ({ label: g.title, value: g.id })),
    []
  );

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log("Form values:", values);
      message.success(isEdit ? "จำลอง: อัปเดตแล้ว" : "จำลอง: สร้างแล้ว");
      form.resetFields();
      setEditingId(null);
    } catch {/* validation */}
  };

  const onDelete = (id: string) => {
    message.success("จำลอง: ลบแล้ว");
    setData(prev => prev.filter(p => p.id !== id));
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
            const title = MOCK_GAMES.find(g => g.id === id)?.title || id;
            return <Tag key={id}>{title}</Tag>;
          })}
        </div>
      ) },
    { title: "จัดการ", key: "actions",
      render: (_: any, r: Promotion) => (
        <Space>
          <Button onClick={() => setEditingId(r.id)}>แก้ไข (UI)</Button>
          <Popconfirm
            title="ลบโปรโมชันนี้?"
            okText="ลบ" cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(r.id)}
          >
            <Button danger>ลบ (UI)</Button>
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

              {/* ช่องอัปโหลดรูปภาพ */}
              <Form.Item name="imageFile" label={<span style={{ color: "#ccc" }}>อัปโหลดรูปภาพ</span>}>
                <Upload
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() => false} // ปิดการอัปโหลดจริง เก็บไฟล์ใน form
                >
                  <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
                </Upload>
              </Form.Item>

              <Space>
                <Button type="primary" onClick={onSubmit}>
                  {isEdit ? "บันทึกการแก้ไข (จำลอง)" : "สร้างโปรโมชัน (จำลอง)"}
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
