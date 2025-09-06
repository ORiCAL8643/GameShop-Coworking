// src/pages/PromotionManager.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Layout, Card, Form, Input, InputNumber, DatePicker, Switch,
  Button, Space, Table, Tag, Popconfirm, message, Typography, Select, Upload,
  Image as AntImage, // ✅ เปลี่ยนชื่อ import กันชนกับ window.Image
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { PlusOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import Sidebar from ".../components/Sidebar";
import { list, create, update, remove, getById } from "../services/promotionsApi";
import type { Promotion } from "../services/promotionsApi";
import { listGames, mapGameTitles } from "../services/gamesApi";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type FormValues = {
  title: string;
  description?: string;
  discountPercent: number;
  dateRange?: [Dayjs, Dayjs];
  active: boolean;
  gameIds: string[];
  imageUrl?: string; // base64 (บีบอัดแล้ว)
};

/* ===== Helpers: compress & size ===== */
function dataUrlBytes(dataUrl: string) {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.ceil((b64.length * 3) / 4);
}

async function compressImageToDataURL(
  file: File,
  { maxWidth = 1280, maxHeight = 1280, maxBytes = 300 * 1024 } = {}
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image(); // ✅ ใช้ window.Image ชัดเจน
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    image.src = url;
  });

  let { width, height } = img;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (dataUrlBytes(out) > maxBytes && quality > 0.35) {
    quality -= 0.1;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return out;
}

export default function PromotionManager() {
  const [form] = Form.useForm<FormValues>();
  const [data, setData] = useState<Promotion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = useMemo(() => Boolean(editingId), [editingId]);

  const gameOptions = useMemo(
    () => listGames().map(g => ({ label: g.title, value: g.id })),
    []
  );

  const reload = () => {
    const items = list();
    console.log("[PromotionManager] reload ->", items);
    setData(items);
  };
  useEffect(() => { reload(); }, []);

  const syncFileListWithForm = () => {
    const url = form.getFieldValue("imageUrl") as string | undefined;
    setFileList(
      url ? [{
        uid: "1",
        name: "promo.jpg",
        status: "done",
        url,
      }] : []
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      discountPercent: 10,
      active: true,
      gameIds: [],
      imageUrl: undefined,
    });
    syncFileListWithForm();
  };
  useEffect(() => { cancelEdit(); }, []);

  const onFinish = async (v: FormValues) => {
    setSubmitting(true);
    const payload: Omit<Promotion, "id" | "createdAt" | "updatedAt"> = {
      title: v.title.trim(),
      description: v.description?.trim(),
      discountPercent: v.discountPercent,
      gameIds: v.gameIds,
      startDate: v.dateRange?.[0]?.toDate().toISOString(),
      endDate: v.dateRange?.[1]?.toDate().toISOString(),
      active: v.active,
      imageUrl: v.imageUrl,
    };
    console.log("[PromotionManager] submit payload ->", payload);

    try {
      if (isEdit && editingId) {
        const updated = update(editingId, payload);
        console.log("[PromotionManager] updated ->", updated);
        if (!updated) throw new Error("Update failed");
        message.success("อัปเดตโปรโมชันสำเร็จ");
        setData(prev => prev.map(p => (p.id === editingId ? updated : p)));
      } else {
        const created = create(payload);
        console.log("[PromotionManager] created ->", created);
        message.success("สร้างโปรโมชันสำเร็จ");
        setData(prev => [created, ...prev]);
      }
      cancelEdit();
      reload();
    } catch (e: any) {
      console.error("[PromotionManager] submit error:", e);
      message.error(e?.message || "เกิดข้อผิดพลาดระหว่างบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = ({ errorFields }: any) => {
    if (errorFields?.length) form.scrollToField(errorFields[0].name);
  };

  const onEditRow = (id: string) => {
    const p = getById(id);
    console.log("[PromotionManager] edit row ->", p);
    if (!p) { message.error("ไม่พบโปรโมชันนี้"); return; }
    setEditingId(id);
    form.setFieldsValue({
      title: p.title,
      description: p.description,
      discountPercent: p.discountPercent,
      gameIds: p.gameIds,
      dateRange: (p.startDate && p.endDate) ? [dayjs(p.startDate), dayjs(p.endDate)] : undefined,
      active: p.active,
      imageUrl: p.imageUrl,
    });
    syncFileListWithForm();
  };

  const onDeleteRow = (id: string) => {
    try {
      const ok = remove(id);
      console.log("[PromotionManager] removed? ->", ok, "id:", id);
      if (ok) {
        message.success("ลบโปรโมชันสำเร็จ");
        setData(prev => prev.filter(p => p.id !== id));
      } else {
        message.error("ลบไม่สำเร็จ");
      }
    } catch (e: any) {
      console.error("[PromotionManager] remove error:", e);
      message.error(e?.message || "ลบไม่สำเร็จ");
    }
    if (editingId === id) cancelEdit();
  };

  /* ===== Upload with compression ===== */
  const handleUploadChange = async (info: { file: UploadFile; fileList: UploadFile[] }) => {
    const { file } = info;

    if (file.status === "removed") {
      form.setFieldValue("imageUrl", undefined);
      setFileList([]);
      return;
    }

    const raw = file.originFileObj;
    if (raw) {
      try {
        const compressed = await compressImageToDataURL(raw, {
          maxWidth: 1280,
          maxHeight: 1280,
          maxBytes: 300 * 1024, // ≤ 300KB
        });

        if (dataUrlBytes(compressed) > 320 * 1024) {
          message.error("รูปใหญ่เกินไป กรุณาเลือกไฟล์เล็กลง (≤ 300KB หลังบีบอัด)");
          return;
        }

        form.setFieldValue("imageUrl", compressed);
        setFileList([{ uid: "1", name: raw.name, status: "done", url: compressed }]);
        message.success(`อัปโหลดสำเร็จ (≈ ${(dataUrlBytes(compressed) / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.error(e);
        message.error("อัปโหลดรูปไม่สำเร็จ");
      }
    }
  };
  const dummyRequest = ({ onSuccess }: any) => setTimeout(() => onSuccess?.("ok"), 0);

  const columns = [
    {
      title: "Banner",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 120,
      render: (url?: string) =>
        url ? (
          <AntImage // ✅ ใช้ AntImage
            src={url}
            alt="promo"
            width={100}
            height={56}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <Tag>no image</Tag>
        ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t: string, r: Promotion) => (
        <Space direction="vertical" size={0}>
          <Text strong>{t}</Text>
          {r.description && <Text type="secondary">{r.description}</Text>}
        </Space>
      ),
    },
    { title: "Discount", dataIndex: "discountPercent", key: "discountPercent", render: (v: number) => <Tag color="purple">{v}%</Tag> },
    {
      title: "Games",
      dataIndex: "gameIds",
      key: "gameIds",
      render: (ids?: string[]) =>
        mapGameTitles(ids).map(name => (
          <Tag key={name} color="geekblue" style={{ marginBottom: 4 }}>
            {name}
          </Tag>
        )),
    },
    { title: "Start", dataIndex: "startDate", key: "startDate", render: (s?: string) => s ? dayjs(s).format("YYYY-MM-DD") : "-" },
    { title: "End", dataIndex: "endDate", key: "endDate", render: (s?: string) => s ? dayjs(s).format("YYYY-MM-DD") : "-" },
    { title: "Active", dataIndex: "active", key: "active", render: (a: boolean) => a ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, r: Promotion) => (
        <Space>
          <Button size="small" onClick={() => onEditRow(r.id)}>Edit</Button>
          <Popconfirm title="ลบโปรโมชันนี้?" okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }} onConfirm={() => onDeleteRow(r.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      <Sidebar />
      <Content style={{ background: "#141414" }}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "linear-gradient(90deg,#9254de 0%,#f759ab 100%)", height: 120, borderRadius: 10, marginBottom: 24 }} />

          <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10, marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                {isEdit ? "Edit Promotion" : "Create Promotion"}
              </Title>

              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={{ discountPercent: 10, active: true, gameIds: [], imageUrl: undefined }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
              >
                {/* hidden field เก็บ base64 */}
                <Form.Item name="imageUrl" hidden>
                  <input type="hidden" />
                </Form.Item>

                <Form.Item label={<span style={{ color: "#ccc" }}>Banner Image</span>}>
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    customRequest={dummyRequest}
                    maxCount={1}
                    accept="image/*"
                    onRemove={() => {
                      form.setFieldValue("imageUrl", undefined);
                      setFileList([]);
                    }}
                  >
                    {fileList.length >= 1 ? null : (
                      <div style={{ color: "#ccc" }}>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="title"
                  label={<span style={{ color: "#ccc" }}>Title</span>}
                  rules={[{ required: true, message: "กรอกชื่อโปรโมชัน" }, { min: 3, message: "อย่างน้อย 3 ตัวอักษร" }]}
                >
                  <Input placeholder="เช่น Mid-Year Sale" />
                </Form.Item>

                <Form.Item name="description" label={<span style={{ color: "#ccc" }}>Description</span>}>
                  <Input.TextArea rows={3} placeholder="รายละเอียดเงื่อนไข / ข้อจำกัด" />
                </Form.Item>

                <Space style={{ display: "flex" }} size="large" wrap>
                  <Form.Item
                    name="discountPercent"
                    label={<span style={{ color: "#ccc" }}>Discount (%)</span>}
                    rules={[{ required: true, message: "กรอกเปอร์เซ็นต์ส่วนลด" }]}
                  >
                    <InputNumber style={{ width: 160 }} min={0} max={100} placeholder="0–100" />
                  </Form.Item>

                  <Form.Item
                    name="gameIds"
                    label={<span style={{ color: "#ccc" }}>Games</span>}
                    rules={[{ required: true, message: "เลือกอย่างน้อย 1 เกม" }]}
                  >
                    <Select mode="multiple" style={{ minWidth: 280 }} options={gameOptions} placeholder="เลือกเกมที่เข้าร่วมโปร" allowClear />
                  </Form.Item>

                  <Form.Item name="dateRange" label={<span style={{ color: "#ccc" }}>Date Range</span>}>
                    <RangePicker />
                  </Form.Item>

                  <Form.Item name="active" label={<span style={{ color: "#ccc" }}>Active</span>} valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Space>

                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    {isEdit ? "Update" : "Create"}
                  </Button>
                  {isEdit && (
                    <Button onClick={cancelEdit} disabled={submitting}>
                      Cancel
                    </Button>
                  )}
                </Space>
              </Form>
            </Space>
          </Card>

          <Card
            title={<span style={{ color: "white" }}>Promotions</span>}
            headStyle={{ background: "#1f1f1f" }}
            bodyStyle={{ background: "#141414" }}
            style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}
          >
            <Table rowKey="id" columns={columns as any} dataSource={data} pagination={{ pageSize: 8 }} />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
