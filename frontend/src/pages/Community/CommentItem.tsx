import { Avatar, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { ThreadComment } from "./types";

const { Text } = Typography;

type Props = { data: ThreadComment };

export default function CommentItem({ data }: Props) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
      <Avatar icon={<UserOutlined />} />
      <div style={{ flex: 1 }}>
        <div style={{ background: "#0c111b", border: "1px solid #1f2942", borderRadius: 10, padding: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <Text style={{ color: "#e6e6e6", fontWeight: 500 }}>{data.userName || "ไม่ระบุ"}</Text>
            <span style={{ color: "#93a0c2", fontSize: 12 }}>
              {data.createdAt ? new Date(data.createdAt).toLocaleString() : ""}
            </span>
          </div>
          <div style={{ color: "#cfd7ef", marginTop: 6 }}>{data.content}</div>
        </div>
      </div>
    </div>
  );
}
