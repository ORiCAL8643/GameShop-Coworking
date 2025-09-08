import { useEffect, useMemo, useState } from "react";
import {
  Layout, Card, Form, Input, InputNumber, DatePicker, Switch,
  Button, Space, Table, Tag, Popconfirm, message, Typography, Select, Upload
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type {
  Promotion,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  DiscountType,
} from "../../interfaces/Promotion";

type GameLite = { id: string; title: string };

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type FormValues = {
  title: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  status: boolean;
  dateRange: [Dayjs, Dayjs];
  gameIds: string[];
  promo_image?: string;
};

export default function PromotionManager() {
  const [form] = Form.useForm<FormValues>();
  const [data, setData] = useState<Promotion[]>([]);
  const [games, setGames] = useState<GameLite[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const isEdit = useMemo(() => editingId !== null, [editingId]);
  const discountType = Form.useWatch("discount_type", form);

  const normalizePromo = (p: any): Promotion => ({
    ID: p.ID ?? p.id,
    title: p.title,
    description: p.description,
    discount_type: p.discount_type,
    discount_value: p.discount_value ?? p.discountPercent ?? 0,
    start_date: p.start_date ?? p.startDate,
    end_date: p.end_date ?? p.endDate,
    status: p.status ?? p.active,
    promo_image: p.promo_image ?? p.imageUrl,
    user_id: p.user_id,
    user: p.user,
    games: p.games,
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
        setGames(
          gameJson.map((g: any) => ({
            id: String(g.id ?? g.ID),
            title: g.title ?? g.game_name,
          })),
        );
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
      await form.validateFields();
      message.success(isEdit ? "จำลอง: อัปเดตแล้ว" : "จำลอง: สร้างแล้ว");
      form.resetFields();
      setEditingId(null);
    } catch {
      message.error("บันทึกไม่สำเร็จ");
    }
  };

  const onDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8088/promotions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("api error");
      setData(prev => prev.filter(p => p.ID !== id));
      message.success("ลบแล้ว");
    } catch {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const columns = [
    {
      title: "ชื่อโปรโมชัน",
      dataIndex: "title",
      key: "title",
      render: (t: string) => <Text style={{ color: "white" }}>{t}</Text>,
    },
    {
      title: "ส่วนลด",
      key: "discount",
      render: (_: any, r: Promotion) =>
        r.discount_type === "PERCENT" ? (
          <Tag color="magenta">{r.discount_value}%</Tag>
        ) : (
          <Tag color="volcano">-{r.discount_value}</Tag>
        ),
    },
    {
      title: "ช่วงเวลา",
      key: "date",
      render: (_: any, r: Promotion) => (
        <Text style={{ color: "#ccc" }}>
          {dayjs(r.start_date).format("YYYY-MM-DD")} → {dayjs(r.end_date).format("YYYY-MM-DD")}
        </Text>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (a: boolean) => (a ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>),
    },
    {
      title: "เกมที่ร่วม",
      key: "games",
      render: (_: any, r: Promotion) => (
        <div>
          {r.games?.map((g: any) => {
            const title =
              games.find(gg => gg.id === String(g.ID))?.title || g.game_name || g.title || g.ID;
            return <Tag key={g.ID}>{title}</Tag>;
          })}
        </div>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      render: (_: any, r: Promotion) => (
        <Space>
          <Button
            onClick={() => {
              setEditingId(r.ID);
              form.setFieldsValue({
                title: r.title,
                description: r.description,
                discount_type: r.discount_type,
                discount_value: r.discount_value,
                dateRange: [dayjs(r.start_date), dayjs(r.end_date)],
                status: r.status,
                gameIds: r.games?.map((g: any) => String(g.ID)) || [],
                promo_image: r.promo_image,
              });
            }}
          >
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบโปรโมชันนี้?"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(r.ID)}
          >
            <Button danger>ลบ</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      <Content style={{ padding: 24, background: "#141414" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Title level={2} style={{ color: "white" }}>Promotion Manager</Title>

          <Card style={{ marginBottom: 16, background: "#1f1f1f", color: "white", borderRadius: 10 }}>
            <Form<FormValues>
              layout="vertical"
              form={form}
              requiredMark="optional"
              initialValues={{
                discount_type: "PERCENT" as DiscountType,
                status: true,
                dateRange: [dayjs(), dayjs().add(7, "day")],
              }}
            >
              <Form.Item
                name="title"
                label={<span style={{ color: "#ccc" }}>ชื่อโปรโมชัน</span>}
                rules={[{ required: true, message: "กรอกชื่อโปรโมชัน" }]}
              >
                <Input placeholder="เช่น Mid-Year Sale" />
              </Form.Item>

              <Form.Item name="description" label={<span style={{ color: "#ccc" }}>รายละเอียด</span>}>
                <Input.TextArea rows={3} placeholder="รายละเอียดโปรโมชัน" />
              </Form.Item>

              <Form.Item
                name="discount_type"
                label={<span style={{ color: "#ccc" }}>ประเภทส่วนลด</span>}
              >
                <Select
                  style={{ width: 160 }}
                  options={[
                    { label: "%", value: "PERCENT" },
                    { label: "จำนวนเงิน", value: "AMOUNT" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="discount_value"
                label={<span style={{ color: "#ccc" }}>มูลค่าส่วนลด</span>}
                rules={[{ required: true, message: "กรอกมูลค่าส่วนลด" }]}
              >
                <InputNumber
                  min={0}
                  max={discountType === "PERCENT" ? 100 : undefined}
                  style={{ width: 160 }}
                />
              </Form.Item>

              <Form.Item
                name="dateRange"
                label={<span style={{ color: "#ccc" }}>ช่วงเวลา</span>}
                rules={[{ required: true, message: "เลือกช่วงเวลา" }]}
              >
                <RangePicker />
              </Form.Item>

              <Form.Item
                name="status"
                label={<span style={{ color: "#ccc" }}>สถานะ</span>}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item name="gameIds" label={<span style={{ color: "#ccc" }}>เกมที่ร่วมรายการ</span>}>
                <Select
                  mode="multiple"
                  placeholder="เลือกเกม"
                  options={gameOptions}
                  style={{ maxWidth: 600 }}
                />
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
            <Table rowKey="ID" columns={columns as any} dataSource={data} pagination={{ pageSize: 8 }} />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
