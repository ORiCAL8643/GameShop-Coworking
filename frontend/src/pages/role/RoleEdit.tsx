// frontend/src/pages/role/RoleEdit.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  message,
  Spin,
  Popconfirm,
  Tooltip,
  ConfigProvider,
  theme,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const API_URL = "http://localhost:8088";

const colorPalette = [
  "#1890ff", "#52c41a", "#13c2c2", "#722ed1", "#eb2f96",
  "#fa8c16", "#f5222d", "#a0a0a0", "#ffec3d", "#2f54eb",
];

interface Permission { ID: number; title: string; description?: string; }
interface User { ID: number; username: string; role_id: number; }
interface RolePermission { ID: number; permission_id: number; }
interface Role {
  ID: number;
  title: string; description?: string; color?: string;
  users?: User[]; role_permissions?: RolePermission[];
}

const RoleEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const roleIdNum = useMemo(() => (id ? Number(id) : undefined), [id]);

  const [messageApi, contextHolder] = message.useMessage();

  // Left: roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Right: detail
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [color, setColor] = useState("#1890ff");
  const [members, setMembers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("display");

  // Permissions
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionStates, setPermissionStates] = useState<Record<number, boolean>>({});
  const [rolePermissionMap, setRolePermissionMap] = useState<Record<number, number>>({});
  const [permissionSearch, setPermissionSearch] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false); // 🔹 สถานะโหลดเวลาทำ Select All / Clear All

  // Users
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Search states
  const [memberSearch, setMemberSearch] = useState("");    // ในแท็บ “จัดการสมาชิก”
  const [addSearchText, setAddSearchText] = useState("");  // ในโมดอล “เพิ่มสมาชิก”

  // Modal add members
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  // Deleting role
  const [deleting, setDeleting] = useState(false);

  // default role (User) to demote when removing
  const defaultRoleId = useMemo(
    () => roles.find((r) => (r.title || "").toLowerCase() === "user")?.ID,
    [roles]
  );

  // -------- fetch --------
  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await axios.get<Role[]>(`${API_URL}/roles`);
      setRoles(res.data || []);
      if (!roleIdNum && res.data?.length) {
        navigate(`/roles/${res.data[0].ID}`, { replace: true });
      }
    } catch {
      messageApi.error("โหลดรายการบทบาทไม่สำเร็จ");
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchRoleDetail = async (rid: number) => {
    setLoadingDetail(true);
    try {
      const [roleRes, permRes, usersRes] = await Promise.all([
        axios.get<Role>(`${API_URL}/roles/${rid}`),
        permissions.length
          ? Promise.resolve({ data: permissions })
          : axios.get<Permission[]>(`${API_URL}/permissions`),
        axios.get<User[]>(`${API_URL}/users`),
      ]);

      const role = roleRes.data;
      setRoleName(role.title || "");
      setRoleDescription(role.description || "");
      setColor(role.color || colorPalette[0]);
      setMembers(role.users || []);

      const map: Record<number, number> = {};
      (role.role_permissions || []).forEach((rp) => {
        map[rp.permission_id] = rp.ID;
      });
      setRolePermissionMap(map);

      const perms = (permRes as any).data as Permission[];
      setPermissions(perms);
      const state: Record<number, boolean> = {};
      perms.forEach((p) => (state[p.ID] = map[p.ID] !== undefined));
      setPermissionStates(state);

      setAllUsers(usersRes.data || []);
    } catch {
      messageApi.error("โหลดข้อมูลบทบาทไม่สำเร็จ");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => { fetchRoles(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (roleIdNum) fetchRoleDetail(roleIdNum); /* eslint-disable-next-line */ }, [roleIdNum]);

  useEffect(() => {
    if (!permissions.length) return;
    setPermissionStates(() => {
      const next: Record<number, boolean> = {};
      permissions.forEach((p) => {
        next[p.ID] = rolePermissionMap[p.ID] !== undefined;
      });
      return next;
    });
  }, [rolePermissionMap, permissions]);

  // -------- actions --------
  const addRole = async () => {
    try {
      const res = await axios.post<Role>(`${API_URL}/roles`, {
        title: "New Role",
        description: "",
        color: "#a0a0a0",
      });
      messageApi.success("สร้างบทบาทใหม่เรียบร้อย");
      await fetchRoles();
      navigate(`/roles/${res.data.ID}`);
    } catch {
      messageApi.error("สร้างบทบาทไม่สำเร็จ");
    }
  };

  const deleteRole = async () => {
    if (!roleIdNum) return;
    try {
      setDeleting(true);
      const key = "deleteRole";
      messageApi.open({ key, type: "loading", content: "กำลังลบบทบาท...", duration: 0 });

      await axios.delete(`${API_URL}/roles/${roleIdNum}`);

      const rolesRes = await axios.get<Role[]>(`${API_URL}/roles`);
      const fresh = rolesRes.data || [];
      setRoles(fresh);

      messageApi.open({ key, type: "success", content: "ลบบทบาทเรียบร้อย", duration: 1.6 });

      if (fresh.length) {
        const oldIdx = roles.findIndex((r) => r.ID === roleIdNum);
        const nextIdx = Math.min(Math.max(oldIdx - 1, 0), fresh.length - 1);
        const nextId = fresh[nextIdx]?.ID;
        if (nextId) {
          navigate(`/roles/${nextId}`, { replace: true });
        }
      } else {
        setRoleName("");
        setRoleDescription("");
        setColor(colorPalette[0]);
        setMembers([]);
        setPermissionStates({});
        setRolePermissionMap({});
      }
    } catch (err: any) {
      messageApi.open({
        type: "error",
        content: err?.response?.data?.error || "ลบบทบาทไม่สำเร็จ",
        duration: 2.4,
      });
    } finally {
      setDeleting(false);
    }
  };

  const updateRole = async () => {
    if (!roleIdNum) return;
    try {
      await axios.patch(`${API_URL}/roles/${roleIdNum}`, {
        title: roleName,
        description: roleDescription,
        color,
      });
      messageApi.success("บันทึกบทบาทเรียบร้อย");
      fetchRoles();
    } catch {
      messageApi.error("บันทึกบทบาทไม่สำเร็จ");
    }
  };

  const togglePermission = async (pid: number, checked: boolean) => {
    if (!roleIdNum) return;
    try {
      if (checked) {
        const res = await axios.post(`${API_URL}/rolepermissions`, {
          role_id: roleIdNum,
          permission_id: pid,
        });
        setRolePermissionMap({ ...rolePermissionMap, [pid]: (res.data as any).ID });
        setPermissionStates({ ...permissionStates, [pid]: true });
      } else {
        const rpID = rolePermissionMap[pid];
        if (!rpID) return;
        await axios.delete(`${API_URL}/rolepermissions/${rpID}`);
        const newMap = { ...rolePermissionMap };
        delete newMap[pid];
        setRolePermissionMap(newMap);
        setPermissionStates({ ...permissionStates, [pid]: false });
      }
    } catch {
      messageApi.error("อัปเดตสิทธิ์ไม่สำเร็จ");
    }
  };

  // 🔹 ช่วยเหลือสำหรับเลือก/ล้าง ทั้งชุด (ทำตามผลการค้นหา)
  const enablePermissions = async (pids: number[]) => {
    if (!roleIdNum) return;
    // เฉพาะตัวที่ยังไม่เปิดอยู่
    const toCreate = pids.filter((pid) => !permissionStates[pid]);
    if (!toCreate.length) return;
    const results = await Promise.all(
      toCreate.map((pid) =>
        axios.post(`${API_URL}/rolepermissions`, {
          role_id: roleIdNum,
          permission_id: pid,
        })
      )
    );
    // อัปเดต map/state ทีเดียว
    const newMap = { ...rolePermissionMap };
    const newState = { ...permissionStates };
    results.forEach((res, idx) => {
      const pid = toCreate[idx];
      const id = (res.data as any).ID;
      newMap[pid] = id;
      newState[pid] = true;
    });
    setRolePermissionMap(newMap);
    setPermissionStates(newState);
  };

  const disablePermissions = async (pids: number[]) => {
    if (!roleIdNum) return;
    // เฉพาะตัวที่เปิดอยู่
    const toDelete = pids.filter((pid) => !!permissionStates[pid]);
    if (!toDelete.length) return;
    await Promise.all(
      toDelete.map((pid) => {
        const rpID = rolePermissionMap[pid];
        if (!rpID) return Promise.resolve(null as any);
        return axios.delete(`${API_URL}/rolepermissions/${rpID}`);
      })
    );
    const newMap = { ...rolePermissionMap };
    const newState = { ...permissionStates };
    toDelete.forEach((pid) => {
      delete newMap[pid];
      newState[pid] = false;
    });
    setRolePermissionMap(newMap);
    setPermissionStates(newState);
  };

  const handleSelectAll = async () => {
    try {
      setBulkLoading(true);
      const ids = filteredPermissions.map((p) => p.ID); // ตามผลการค้นหา
      await enablePermissions(ids);
      messageApi.success("เปิดสิทธิ์ทั้งหมดตามที่แสดงแล้ว");
    } catch {
      messageApi.error("เปิดสิทธิ์ทั้งหมดไม่สำเร็จ");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setBulkLoading(true);
      const ids = filteredPermissions.map((p) => p.ID); // ตามผลการค้นหา
      await disablePermissions(ids);
      messageApi.success("ปิดสิทธิ์ทั้งหมดตามที่แสดงแล้ว");
    } catch {
      messageApi.error("ปิดสิทธิ์ทั้งหมดไม่สำเร็จ");
    } finally {
      setBulkLoading(false);
    }
  };

  // remove member (demote to default role)
  const removeMember = async (uid: number, username: string) => {
    if (!roleIdNum) return;
    if (!defaultRoleId || defaultRoleId === roleIdNum) {
      messageApi.error("ไม่พบ/ไม่สามารถย้ายไปบทบาทพื้นฐาน");
      return;
    }
    try {
      await axios.patch(`${API_URL}/users/${uid}/role`, { role_id: defaultRoleId });
      const res = await axios.get<Role>(`${API_URL}/roles/${roleIdNum}`);
      setMembers(res.data.users || []);
      messageApi.success(`นำ ${username} ออกจากบทบาทเรียบร้อย`);
    } catch {
      messageApi.error("นำสมาชิกออกไม่สำเร็จ");
    }
  };

  // -------- modal add members --------
  const showModal = () => {
    setIsModalVisible(true);
    setSelectedMembers([]);
    setAddSearchText("");
  };

  const handleCheckboxToggle = (uid: number) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  };

  const handleOk = async () => {
    if (!roleIdNum || selectedMembers.length === 0) {
      setIsModalVisible(false);
      return;
    }
    try {
      setAddingMembers(true);
      await Promise.all(
        selectedMembers.map((uid) =>
          axios.patch(`${API_URL}/users/${uid}/role`, { role_id: roleIdNum })
        )
      );
      const res = await axios.get<Role>(`${API_URL}/roles/${roleIdNum}`);
      setMembers(res.data.users || []);
      setIsModalVisible(false);
      setSelectedMembers([]);
      messageApi.success("เพิ่มสมาชิกเข้าบทบาทเรียบร้อย");
    } catch {
      messageApi.error("เพิ่มสมาชิกไม่สำเร็จ");
    } finally {
      setAddingMembers(false);
    }
  };

  const handleCancel = () => setIsModalVisible(false);

  // -------- filters --------
  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(addSearchText.toLowerCase()) &&
      !members.some((m) => m.ID === u.ID)
  );

  const filteredMembersTab = useMemo(
    () =>
      members.filter((m) =>
        m.username.toLowerCase().includes(memberSearch.toLowerCase())
      ),
    [members, memberSearch]
  );

  const filteredPermissions = permissions.filter((p) =>
    (p.title || "").toLowerCase().includes((permissionSearch || "").toLowerCase())
  );

  // 🔹 ความสูงสกอร์ลเฉพาะส่วน
  const scrollAreaHeight = "calc(100vh - 260px)";

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgBase: "#141414",
          colorBgContainer: "#1f1f1f",
          colorText: "#ffffff",
          colorTextSecondary: "#aaaaaa",
          colorBorder: "#303030",
          colorPrimary: "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      {contextHolder}

      {/* ไม่แตะ CSS ภายนอก — ใช้เฉพาะ inline style */}
      <div
        className="role-page"
        style={{ background: "#141414", height: "100vh", flex: 1, overflow: "hidden", display: "flex" }}
      >
        {/* Left */}
        <div style={{ width: 220, padding: 12, borderRight: "1px solid #333", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
            <Button
              type="text"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/roles", { replace: true })}
              style={{ color: "white" }}
            >
              ย้อนกลับ
            </Button>
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={addRole} style={{ color: "white" }} title="สร้างบทบาทใหม่" />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <Spin spinning={rolesLoading}>
              {roles.map((role) => {
                const isActive = role.ID === roleIdNum;
                return (
                  <div
                    key={role.ID}
                    onClick={() => navigate(`/roles/${role.ID}`)}
                    style={{
                      display: "flex", alignItems: "center", padding: "8px 12px", marginBottom: 4,
                      borderRadius: 6, cursor: "pointer", color: "white",
                      background: isActive ? "#2f3136" : "transparent",
                      borderLeft: isActive ? `4px solid ${role.color || "#1890ff"}` : "4px solid transparent",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.background = "#1f1f1f"); }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.background = "transparent"); }}
                  >
                    <span style={{ color: role.color || "#1890ff", marginRight: 8 }}>●</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {role.title}
                    </span>
                  </div>
                );
              })}
            </Spin>
          </div>
        </div>

        {/* Right */}
        <div
          style={{
            flex: 1,
            padding: "16px 32px",
            boxSizing: "border-box",
            maxWidth: "1000px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Header (fixed) */}
          <div style={{ display: "flex", marginBottom: 16, alignItems: "center", gap: 16 }}>
            <Title level={4} style={{ color: "white", margin: 0 }}>
              แก้ไขบทบาท – {roleName ? roleName.toUpperCase() : "LOADING"}
            </Title>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Popconfirm title="ต้องการลบบทบาทนี้หรือไม่?" okText="ลบ" cancelText="ยกเลิก" onConfirm={deleteRole}>
                <Button danger icon={<DeleteOutlined />} loading={deleting}>ลบ</Button>
              </Popconfirm>
              <Button type="primary" onClick={updateRole}>บันทึก</Button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <Spin spinning={loadingDetail}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "display",
                    label: <Text style={{ color: "white" }}>การแสดงผล</Text>,
                    children: (
                      <div style={{ maxWidth: 700, height: scrollAreaHeight, overflowY: "auto", paddingRight: 8 }}>
                        <div style={{ marginBottom: 16 }}>
                          <Text style={{ color: "white" }}>
                            ชื่อตำแหน่ง <Text type="danger">*</Text>
                          </Text>
                          <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} style={{ marginTop: 8 }} />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <Text style={{ color: "white" }}>คำอธิบายตำแหน่ง</Text>
                          <Input.TextArea value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} rows={3} style={{ marginTop: 8 }} />
                        </div>

                        <div>
                          <Text style={{ color: "white" }}>
                            สีตำแหน่ง <Text type="danger">*</Text>
                          </Text>
                          <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                            {colorPalette.map((c) => (
                              <Col key={c}>
                                <div
                                  onClick={() => setColor(c)}
                                  style={{
                                    width: 32, height: 32, borderRadius: 6, cursor: "pointer",
                                    background: c, border: color === c ? "2px solid #fff" : "2px solid transparent",
                                  }}
                                />
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "permissions",
                    label: <Text style={{ color: "white" }}>การอนุญาต</Text>,
                    children: (
                      <div style={{ maxWidth: 700 }}>
                        {/* แถวควบคุมค้นหา + ปุ่มเลือก/ล้างทั้งหมด */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                          <Input.Search
                            placeholder="ค้นหาสิทธิ์"
                            value={permissionSearch}
                            onChange={(e) => setPermissionSearch(e.target.value)}
                            style={{ flex: "1 1 260px", minWidth: 220 }}
                            allowClear
                          />
                          <Button
                            onClick={handleSelectAll}
                            loading={bulkLoading}
                            disabled={bulkLoading || filteredPermissions.length === 0}
                          >
                            เลือกทั้งหมด (ตามที่แสดง)
                          </Button>
                          <Button
                            onClick={handleClearAll}
                            loading={bulkLoading}
                            disabled={bulkLoading || filteredPermissions.length === 0}
                          >
                            ล้างทั้งหมด (ตามที่แสดง)
                          </Button>
                        </div>

                        {/* 🔹 เลื่อนเฉพาะรายการสิทธิ์ */}
                        <div style={{ height: scrollAreaHeight, overflowY: "auto", paddingRight: 8 }}>
                          {filteredPermissions.map((perm) => (
                            <div
                              key={perm.ID}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 0",
                                borderBottom: "1px solid #333",
                                color: "white",
                              }}
                            >
                              <div style={{ paddingRight: 16 }}>
                                <div style={{ fontWeight: 600 }}>{perm.title}</div>
                                {perm.description && (
                                  <div style={{ color: "#aaa", fontSize: 12 }}>{perm.description}</div>
                                )}
                              </div>
                              <Switch
                                checked={!!permissionStates[perm.ID]}
                                onChange={(checked) => togglePermission(perm.ID, checked)}
                              />
                            </div>
                          ))}
                          {!filteredPermissions.length && (
                            <div style={{ color: "#aaa" }}>ไม่พบสิทธิ์ที่ค้นหา</div>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "members",
                    label: <Text style={{ color: "white" }}>จัดการสมาชิก</Text>,
                    children: (
                      <div style={{ height: scrollAreaHeight, overflowY: "auto", paddingRight: 8 }}>
                        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <Input
                            placeholder="ค้นหาสมาชิก"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            style={{ width: "70%" }}
                          />
                          <Button type="primary" onClick={showModal}>เพิ่มสมาชิก</Button>
                        </div>

                        {filteredMembersTab.length === 0 ? (
                          <div style={{ color: "#aaa", textAlign: "center" }}>
                            ไม่พบสมาชิก{memberSearch ? "ตามคำค้น" : ""}{" "}
                            {!memberSearch && (
                              <a style={{ color: "#1890ff" }} onClick={showModal}>
                                เพิ่มสมาชิกให้กับบทบาทนี้
                              </a>
                            )}
                          </div>
                        ) : (
                          <List
                            dataSource={filteredMembersTab}
                            renderItem={(m) => (
                              <List.Item
                                actions={
                                  roleIdNum !== defaultRoleId
                                    ? [
                                      <Tooltip title="ลบสมาชิกออก" key="remove">
                                        <Popconfirm
                                          title={`ยืนยันนำ ${m.username} ออกจากบทบาทนี้?`}
                                          okText="ลบ"
                                          cancelText="ยกเลิก"
                                          onConfirm={() => removeMember(m.ID, m.username)}
                                        >
                                          <Button danger size="small" shape="circle" icon={<CloseOutlined />} />
                                        </Popconfirm>
                                      </Tooltip>,
                                    ]
                                    : []
                                }
                              >
                                <span style={{ color: "white" }}>{m.username}</span>
                              </List.Item>
                            )}
                          />
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Spin>
          </div>

          {/* Modal: เพิ่มสมาชิก */}
          <Modal
            title={<span style={{ color: "black" }}>เพิ่มสมาชิก</span>}
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="เพิ่ม"
            cancelText="ยกเลิก"
            confirmLoading={addingMembers}
          >
            <Input.Search
              placeholder="ค้นหาสมาชิก"
              value={addSearchText}
              onChange={(e) => setAddSearchText(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              <List
                dataSource={filteredUsers}
                renderItem={(user) => {
                  const selected = selectedMembers.includes(user.ID);
                  return (
                    <List.Item
                      key={user.ID}
                      onClick={() => handleCheckboxToggle(user.ID)}
                      style={{
                        cursor: "pointer",
                        borderRadius: 6,
                        marginBottom: 6,
                        padding: "10px 12px",
                        backgroundColor: selected ? "#e6f4ff" : "transparent",
                        border: selected ? "1px solid #91caff" : "1px solid transparent",
                        transition: "background-color 0.15s, border-color 0.15s",
                      }}
                      actions={[
                        selected ? (
                          <CheckOutlined key="checked" style={{ color: "#1677ff" }} />
                        ) : null,
                      ]}
                    >
                      <Checkbox
                        checked={selected}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckboxToggle(user.ID);
                        }}
                        style={{ marginRight: 8 }}
                      />
                      <span style={{ color: "#000" }}>{user.username}</span>
                    </List.Item>
                  );
                }}
              />
            </div>
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default RoleEdit;
