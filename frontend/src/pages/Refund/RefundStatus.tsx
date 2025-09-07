// pages/Refund/RefundStatus.tsx

import { Table, Tag, Typography, Card } from "antd";

const { Title } = Typography;

// 🟣 export interface Refund ให้ไฟล์อื่น import ใช้ได้
export interface Refund {
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
            ? "#e39cf1ff"
            : status === "Approved"
            ? "#00e14fff"
            : "#fe082dff";
        return (
          <Tag
            color={color}
            style={{
              fontWeight: 700,
              fontSize: "16px",
              padding: "6px 14px",
              borderRadius: "12px",
              color: "#fff",
              textShadow: "0 0 6px rgba(255,255,255,0.6)",
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
        padding: "40px 20px",
        backgroundColor: "#141414",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          padding: 30,
          width: "100%",
          maxWidth: 1100,
          background: "#1b1034",
          boxShadow: "0 0 25px rgba(168, 85, 247, 0.6)",
        }}
      >
        <Title
          level={2}
          style={{
            color: "#c084fc",
            textShadow: "0 0 12px #c084fc",
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          Refund Status
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
            background: "#1b1034",
          }}
          rowClassName={() => "refund-row"}
        />
      </Card>

      <style>{`
        .refund-row {
          background-color: #1b1034;
          color: #db4bc0ff;
          transition: all 0.3s;
        }
        .refund-row:hover {
          background: linear-gradient(
            90deg,
            rgba(155, 89, 182, 0.2),
            rgba(142, 68, 173, 0.5)
          );
          box-shadow: 0 0 12px #9b59b6, 0 0 20px #8e44ad inset;
        }
        .ant-table-thead > tr > th {
          background-color: #2c0d46 !important;
          color: #f3e5ff !important;
          text-shadow: 0 0 5px #9b59b6;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #3a0f55;
        }
      `}</style>
    </div>
  );
}
