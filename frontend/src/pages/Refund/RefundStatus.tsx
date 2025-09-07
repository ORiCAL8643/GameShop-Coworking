// pages/RefundStatusPage.tsx
import { Table, Tag, Typography, Card } from "antd";

const { Title } = Typography;

interface Refund {
  id: number;
  orderId: string;
  user: string;
  game: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

interface RefundStatusPageProps {
  refunds: Refund[];
}

export default function RefundStatusPage({ refunds }: RefundStatusPageProps) {
  const columns = [
    { title: "Order ID", dataIndex: "orderId", key: "orderId" },
    { title: "User", dataIndex: "user", key: "user" },
    { title: "Game", dataIndex: "game", key: "game" },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "Pending"
            ? "#a855f7" // ม่วงสด
            : status === "Approved"
            ? "#22c55e" // เขียว
            : "#ef4444"; // แดง

        return (
          <Tag
            color={color}
            style={{
              fontWeight: 700,
              fontSize: 16, // ✅ ตัวใหญ่
              padding: "8px 20px", // ✅ กล่องใหญ่ขึ้น
              borderRadius: 12,
              color: "#3a044eff",
              textShadow: "0 0 8px rgba(145, 51, 216, 0.8)",
              boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
            }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Refund) =>
        record.status === "Pending" ? (
          <span
            style={{
              color: "#f472b6",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 18,
              textShadow: "0 0 8px #f472b6",
            }}
          >
            $
          </span>
        ) : null,
    },
  ];

  return (
    <div
      style={{
        padding: "50px 20px",
        background: "linear-gradient(135deg, #0d0217, #1a0b2e)",
        minHeight: "100vh", // ✅ เต็มจอ
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        overflow: "hidden", // ✅ กันแถบขาว
      }}
    >
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          padding: 30,
          width: "100%",
          maxWidth: 1100,
          background: "rgba(27, 16, 52, 0.9)",
          boxShadow: "0 0 25px rgba(168, 85, 247, 0.6)",
        }}
      >
        <Title
          level={2}
          style={{
            color: "#c084fc",
            textShadow: "0 0 18px #a855f7",
            marginBottom: 25,
            textAlign: "center",
          }}
        >
          🎮 Refund Status
        </Title>

        <Table
          dataSource={refunds}
          columns={columns}
          rowKey="id"
          pagination={false}
          bordered
          style={{
            borderRadius: 16,
            overflow: "hidden",
            width: "100%",
            background: "transparent",
          }}
          rowClassName={() => "refund-row"}
        />
      </Card>

      <style>{`
        .refund-row {
          background-color: #38285fff;
          color: #a360ebff;
          transition: all 0.3s;
        }
        .refund-row:hover {
          background: linear-gradient(
            90deg,
            rgba(198, 190, 205, 0.43),
            rgba(147,51,234,0.5)
          );
          box-shadow: 0 0 15px #a855f7, 0 0 25px #9333ea inset;
        }
        .ant-table-thead > tr > th {
          background-color: #4d296aff !important;
          color: #b078e1ff !important;
          text-shadow: 0 0 8px #a855f7;
          font-size: 15px;
          font-weight: 600;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #3a0f55 !important;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
