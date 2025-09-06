import { Card, Table, Tag, Space, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type RequestStatus = "pending" | "approved" | "rejected";
type Row = {
  id: number;
  game_name: string;
  category: string;
  requester: string;
  requested_at: string; // แสดงเป็นข้อความพอ
  status: RequestStatus;
  cover_url?: string;
};

const STATUS: Record<RequestStatus, { label: string; color: string }> = {
  pending:  { label: "รอตรวจสอบ", color: "gold" },
  approved: { label: "อนุมัติ",    color: "green" },
  rejected: { label: "ปฏิเสธ",     color: "red" },
};

const data: Row[] = [
  { id: 101, game_name: "100% Orange Juice", category: "Party", requester: "alice@example.com", requested_at: "04/09/2025 13:20", status: "pending"/*, cover_url: "https://i.imgur.com/1.jpg" */},
  { id: 102, game_name: "Deep FPS",          category: "FPS",   requester: "bob@example.com",   requested_at: "03/09/2025 18:05", status: "approved" },
  { id: 103, game_name: "Cozy Horror",       category: "Horror",requester: "cara@example.com",  requested_at: "01/09/2025 09:40", status: "rejected" },
  { id: 104, game_name: "Deep FPS",          category: "FPS",   requester: "bob@example.com",   requested_at: "03/09/2025 18:05", status: "approved" },
  { id: 105, game_name: "Cozy Horror",       category: "Horror",requester: "cara@example.com",  requested_at: "01/09/2025 09:40", status: "rejected" },
  { id: 106, game_name: "Deep FPS",          category: "FPS",   requester: "bob@example.com",   requested_at: "03/09/2025 18:05", status: "approved" },
  { id: 107, game_name: "Cozy Horror",       category: "Horror",requester: "cara@example.com",  requested_at: "01/09/2025 09:40", status: "rejected" },
  { id: 108, game_name: "Deep FPS",          category: "FPS",   requester: "bob@example.com",   requested_at: "03/09/2025 18:05", status: "approved" },
  { id: 109, game_name: "Cozy Horror",       category: "Horror",requester: "cara@example.com",  requested_at: "01/09/2025 09:40", status: "rejected" },
  { id: 110, game_name: "Deep FPS",          category: "FPS",   requester: "bob@example.com",   requested_at: "03/09/2025 18:05", status: "approved" },
  { id: 111, game_name: "Cozy Horror",       category: "Horror",requester: "cara@example.com",  requested_at: "01/09/2025 09:40", status: "rejected" },
  { id: 112, game_name: "Deep FPS",          category: "FPS",   requester: "bob@example.com",   requested_at: "03/09/2025 18:05", status: "approved" },
  { id: 113, game_name: "Cozy Horror",       category: "Horror",requester: "cara@example.com",  requested_at: "01/09/2025 09:40", status: "rejected" },
];

const columns: ColumnsType<Row> = [
  {
    title: "เกม",
    dataIndex: "game_name",
    render: (_, r) => (
      <Space align="start">
        {r.cover_url ? (
          <img src={r.cover_url} alt={r.game_name}
               style={{ width: 72, height: 44, objectFit: "cover", borderRadius: 8 }} />
        ) : (
          <div style={{ width: 72, height: 44, borderRadius: 8, background: "rgba(255,255,255,.06)" }} />
        )}
        <div>
          <div style={{ fontWeight: 600 }}>{r.game_name}</div>
          <Text type="secondary">{r.category}</Text>
        </div>
      </Space>
    ),
  },
  { title: "ผู้รีเควส", dataIndex: "requester", width: 180, ellipsis: true },
  { title: "วันที่รีเควส", dataIndex: "requested_at", width: 160 },
  {
    title: "สถานะ",
    dataIndex: "status",
    width: 120,
    render: (st: RequestStatus) => <Tag color={STATUS[st].color}>{STATUS[st].label}</Tag>,
  },
];

export default function Requestinfo() {
  return (
    <div style={{ padding: 16, background:'#141414', minHeight:'100vh'}}>
      <Card
        bodyStyle={{ padding: 20 }}
        style={{ border: "1px solid rgba(255,255,255,0.08)", background:'#3d3d3dff'}}
      >
        <Title level={3} style={{ marginBottom: 12, color:'#fdbcbcff'}}>Request Queue</Title>
        <Table<Row>
          rowKey="id"
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          bordered style={{ background:'#707070ff', borderRadius: 10}}
        />
      </Card>
    </div>
  );
}