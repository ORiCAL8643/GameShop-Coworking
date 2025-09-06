// pages/RefundStatusPage.tsx
import { Table, Tag, Typography } from "antd";

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
            ? "#e39cf1ff" // neon light purple
            : status === "Approved"
            ? "#00e14fff" // deep purple
            : "#fe082dff"; // neon pink/red
        return <Tag color={color} style={{ fontWeight: 700, color: "#fff", textShadow: "0 0 6px rgba(255,255,255,0.6)" }}>{status}</Tag>;
      }
    },
    {
      title: "$",
      key: "dollar",
      render: (_: any, record: Refund) => record.status === "Pending" ? "$" : null,
    }
  ];

  return (
    <div style={{ padding: 30, backgroundColor: "#141414", minHeight: "100%" }}>
      <Title level={2} style={{ color: "#c084fc", textShadow: "0 0 10px #c084fc" }}>Refund Status</Title>
      <Table
        dataSource={refunds}
        columns={columns}
        rowKey="id"
        pagination={false}
        bordered
        style={{ borderRadius: 12, overflow: "hidden" }}
        rowClassName={() => "refund-row"}
        scroll={{ x: true }}
      />
      <style jsx>{`
        .refund-row {
          background-color: #1b1034;
          color: #db4bc0ff;
          transition: all 0.3s;
        }
        .refund-row:hover {
          background: linear-gradient(90deg, rgba(155,89,182,0.2), rgba(142,68,173,0.5));
          box-shadow: 0 0 12px #9b59b6, 0 0 20px #8e44ad inset;
        }
        .ant-table-thead > tr > th {
          background-color: #2c0d46;
          color: #f3e5ff;
          text-shadow: 0 0 5px #9b59b6;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #3a0f55;
        }
        .ant-table-container {
          background-color: #1b1034;
        }
      `}</style>
    </div>
  );
}
