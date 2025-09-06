import React, { useState } from "react";
import {
  Typography,
  Input,
  Tabs,
  Button,
  Row,
  Col,
  Switch,
  Modal,
  List,
  Checkbox,
} from "antd";
import { ArrowLeftOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const RoleEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<
    { id: string; name: string; color: string; description: string }[]
  >([
    { id: "1", name: "Admin", color: "#1890ff", description: "ผู้ดูแลระบบทั้งหมด" },
    { id: "2", name: "Customer", color: "#52c41a", description: "ลูกค้าทั่วไป" },
  ]);

  const [activeRoleId, setActiveRoleId] = useState(id ?? "1");
  const currentRole = roles.find((r) => r.id === activeRoleId) || roles[0];

  const [roleName, setRoleName] = useState(currentRole.name);
  const [roleDescription, setRoleDescription] = useState(currentRole.description);
  const [color, setColor] = useState(currentRole.color);
  const [activeTab, setActiveTab] = useState("display");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [searchText, setSearchText] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const mockMembers = [
    { id: 1, name: "User_A", tag: "user_a#1234" },
    { id: 2, name: "User_B", tag: "user_b#5678" },
    { id: 3, name: "User_C", tag: "user_c#9101" },
    { id: 4, name: "User_D", tag: "user_d#1121" },
    { id: 5, name: "User_E", tag: "user_e#3141" },
  ];

  const colorPalette = [
    "#1890ff", "#52c41a", "#13c2c2", "#722ed1", "#eb2f96",
    "#fa8c16", "#f5222d", "#a0a0a0", "#ffec3d", "#2f54eb",
  ];

  const permissionsList = [
    { key: "view_store", label: "ดูร้านค้า", description: "เข้าชมเกมทั้งหมดในร้านค้า" },
    { key: "purchase_game", label: "ซื้อเกม", description: "สามารถสั่งซื้อเกมผ่านระบบ" },
    { key: "view_own_library", label: "ดูคลังเกมของตัวเอง", description: "เข้าดูเกมที่ซื้อแล้ว" },
    { key: "download_game", label: "ดาวน์โหลดเกม", description: "ดาวน์โหลดเกมที่ซื้อแล้ว" },
    { key: "write_review", label: "เขียนรีวิว", description: "เขียนรีวิวหรือให้คะแนนเกม" },
    { key: "comment_game", label: "คอมเมนต์เกม", description: "แสดงความคิดเห็นบนหน้ารายละเอียดเกม" },
    { key: "edit_profile", label: "แก้ไขโปรไฟล์", description: "แก้ไขข้อมูลส่วนตัว เช่น ชื่อ หรือรูปโปรไฟล์" },
    { key: "view_order_history", label: "ดูประวัติคำสั่งซื้อ", description: "ตรวจสอบคำสั่งซื้อที่ผ่านมา" },
    { key: "manage_users", label: "จัดการผู้ใช้", description: "เพิ่ม, ลบ หรือแก้ไขบัญชีผู้ใช้ทั่วไป" },
    { key: "manage_roles", label: "จัดการบทบาท", description: "กำหนดบทบาทและสิทธิ์ของผู้ใช้และแอดมิน" },
    { key: "manage_games", label: "จัดการเกม", description: "เพิ่ม, แก้ไข, หรือลบเกมในร้าน" },
    { key: "manage_categories", label: "จัดการหมวดหมู่เกม", description: "จัดการหมวดหมู่เกมเพื่อเรียงหมวดง่าย" },
    { key: "view_sales_reports", label: "ดูรายงานการขาย", description: "ดูสถิติการขายและรายได้" },
    { key: "process_refunds", label: "คืนเงิน", description: "ดำเนินการคืนเงินให้ลูกค้า" },
    { key: "moderate_reviews", label: "ตรวจสอบรีวิว", description: "ลบหรือแก้ไขรีวิวที่ไม่เหมาะสม" },
    { key: "manage_discounts", label: "จัดการโปรโมชั่น", description: "สร้างหรือแก้ไขโปรโมชั่น/ส่วนลดต่าง ๆ" },
    { key: "view_analytics", label: "ดู Analytics", description: "ดูข้อมูลเชิงลึก เช่น การใช้งานผู้ใช้, ยอดขาย" },
    { key: "manage_orders", label: "จัดการคำสั่งซื้อ", description: "ตรวจสอบและปรับสถานะคำสั่งซื้อ" },
    { key: "send_notifications", label: "ส่งแจ้งเตือน", description: "ส่งข้อความหรืออีเมลแจ้งผู้ใช้" },
    { key: "configure_settings", label: "ตั้งค่าระบบ", description: "ตั้งค่าทั่วไปของร้าน เช่น วิธีชำระเงิน, การแสดงผล" },
  ];

  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(permissionsList.map((p) => [p.key, false]))
  );

  const showModal = () => {
    setIsModalVisible(true);
    setSelectedMembers([]);
    setSearchText("");
  };

  const handleOk = () => {
    console.log("Adding members:", selectedMembers);
    setIsModalVisible(false);
    setSelectedMembers([]);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedMembers([]);
  };

  const handleCheckboxChange = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const filteredMembers = mockMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchText.toLowerCase()) ||
      m.tag.toLowerCase().includes(searchText.toLowerCase())
  );

  const updateRole = () => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === activeRoleId
          ? { ...r, name: roleName, color, description: roleDescription }
          : r
      )
    );
  };

  const addRole = () => {
    const newId = (roles.length + 1).toString();
    const newRole = { id: newId, name: "New Role", color: "#a0a0a0", description: "" };
    setRoles([...roles, newRole]);
    setActiveRoleId(newId);
    setRoleName(newRole.name);
    setColor(newRole.color);
    setRoleDescription(newRole.description);
  };

  return (
    <div style={{ background: "#141414", minHeight: "100vh", display: "flex" }}>
      {/* Role List */}
      <div
        style={{
          width: 220,
          padding: 12,
          borderRight: "1px solid #333",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "white",
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ color: "white" }}
          >
            ย้อนกลับ
          </Button>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={addRole}
            style={{ color: "white" }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {roles.map((role) => {
            const isActive = role.id === activeRoleId;
            return (
              <div
                key={role.id}
                onClick={() => {
                  setActiveRoleId(role.id);
                  setRoleName(role.name);
                  setColor(role.color);
                  setRoleDescription(role.description);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  marginBottom: 4,
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "white",
                  background: isActive ? "#2f3136" : "transparent",
                  borderLeft: isActive ? `4px solid ${role.color}` : "4px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget.style.background = "#1f1f1f");
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget.style.background = "transparent");
                }}
              >
                <span style={{ color: role.color, marginRight: 8 }}>●</span>
                <span>{role.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          padding: "16px 32px",
          boxSizing: "border-box",
          maxWidth: "1000px", // กำหนดความกว้างสูงสุด
          margin: "0 auto",   // ทำให้มีพื้นที่ว่างซ้ายขวาเหมือน Discord
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            marginBottom: 16,
            alignItems: "center",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <Title level={4} style={{ color: "white", margin: 0 }}>
            แก้ไขบทบาท – {roleName.toUpperCase()}
          </Title>
          <Button
            type="primary"
            onClick={updateRole}
            style={{ marginLeft: "auto", padding: "0 16px", height: 36 }}
          >
            บันทึก
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "display", label: <Text style={{ color: "white" }}>การแสดงผล</Text> },
            { key: "permission", label: <Text style={{ color: "white" }}>การอนุญาต</Text> },
            { key: "members", label: <Text style={{ color: "white" }}>จัดการสมาชิก</Text> },
          ]}
          style={{ flexShrink: 0 }}
        />

        {/* Tab Content Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginTop: 16,
            paddingRight: 8,
            scrollbarWidth: "thin",
            scrollbarColor: "#555 #2f3136",
          }}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #2f3136;
              }
              div::-webkit-scrollbar-thumb {
                background-color: #555;
                border-radius: 4px;
              }
            `}
          </style>

          {/* Display Tab */}
          {activeTab === "display" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: "white" }}>
                  ชื่อตำแหน่ง <Text type="danger">*</Text>
                </Text>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  style={{
                    marginTop: 8,
                    background: "#2f3136",
                    color: "white",
                    border: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: "white" }}>คำอธิบายตำแหน่ง</Text>
                <Input.TextArea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={3}
                  style={{
                    marginTop: 8,
                    background: "#2f3136",
                    color: "white",
                    border: "none",
                  }}
                />
              </div>

              <div>
                <Text style={{ color: "white" }}>
                  สี ตำแหน่ง <Text type="danger">*</Text>
                </Text>
                <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                  {colorPalette.map((c) => (
                    <Col key={c}>
                      <div
                        onClick={() => setColor(c)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          cursor: "pointer",
                          background: c,
                          border: color === c ? "2px solid white" : "2px solid transparent",
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          )}

          {/* Permission Tab */}
          {activeTab === "permission" && (
            <div>
              <Input
                placeholder="ค้นหาการอนุญาต"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                style={{
                  marginBottom: 16,
                  background: "white",
                  color: "black",
                  border: "none",
                }}
              />
              {permissionsList
                .filter(
                  (p) =>
                    p.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                    p.description.toLowerCase().includes(permissionSearch.toLowerCase())
                )
                .map((perm) => (
                  <div
                    key={perm.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #333",
                    }}
                  >
                    <div>
                      <Text style={{ color: "white", fontWeight: 500 }}>{perm.label}</Text>
                      <br />
                      <Text style={{ color: "#aaa", fontSize: 12 }}>{perm.description}</Text>
                    </div>
                    <Switch
                      checked={permissions[perm.key]}
                      onChange={(checked) =>
                        setPermissions((prev) => ({ ...prev, [perm.key]: checked }))
                      }
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Input
                  placeholder="ค้นหาสมาชิก"
                  className="custom-input"
                  style={{ width: "70%", background: "white", color: "black" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                <Button type="primary" onClick={showModal}>
                  เพิ่มสมาชิก
                </Button>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#aaa",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      width="48"
                      height="48"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div>
                    ไม่พบสมาชิกใด ๆ{" "}
                    <a style={{ color: "#1890ff" }} onClick={showModal}>
                      เพิ่มสมาชิกให้กับบทบาทนี้
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={<span style={{ color: "black" }}>เพิ่มสมาชิก</span>}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="เพิ่ม"
        cancelText="ยกเลิก"
      >
        <Input.Search
          placeholder="ค้นหาสมาชิก"
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          <List
            dataSource={filteredMembers}
            renderItem={(member) => (
              <List.Item
                key={member.id}
                style={{
                  backgroundColor: selectedMembers.includes(member.id)
                    ? "#f0f0f0"
                    : "transparent",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={() => handleCheckboxChange(member.id)}
              >
                <Checkbox
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleCheckboxChange(member.id)}
                  style={{ marginRight: 8 }}
                />
                <span>{member.name}</span>
                <span style={{ marginLeft: 8, color: "#888" }}>{member.tag}</span>
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default RoleEdit;
