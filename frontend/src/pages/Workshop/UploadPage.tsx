// src/pages/Workshop/UploadPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Typography, Card, Input, Button, Upload, message, Space } from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  PictureOutlined,
  InboxOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getGame, getMod, createMod, updateMod } from "../../services/workshop";
import type { Game } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Title } = Typography;
const { Dragger } = Upload;

// helper ไอคอนติ๊ก/กากบาทให้ Checklist
const Ok: React.FC<{ ok: boolean }> = ({ ok }) => (
  <span style={{ color: ok ? "#52c41a" : "#ff4d4f", fontWeight: 600 }}>
    {ok ? "✅" : "❌"}
  </span>
);

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameIdParam = searchParams.get("gameId");
  const modIdParam = searchParams.get("modId");
  const gameId = gameIdParam ? Number(gameIdParam) : undefined;
  const modId = modIdParam ? Number(modIdParam) : undefined;

  const { id: userId, token } = useAuth() as { id?: number; token?: string };

  const [game, setGame] = useState<Game | null>(null);
  const isEditing = modId !== undefined;

  useEffect(() => {
    if (gameId) {
      getGame(gameId)
        .then(setGame)
        .catch((e) => {
          console.error("[getGame] failed:", e);
          message.error(e?.message || "โหลดข้อมูลเกมไม่สำเร็จ");
        });
    }
  }, [gameId]);

  useEffect(() => {
    if (modId) {
      getMod(modId)
        .then((m: any) => {
          setModTitle(m?.title ?? "");
          setModDescription(m?.description ?? "");
          const ugid = m?.user_game_id ?? m?.userGameId ?? m?.UserGameID ?? undefined;
          setUserGameId(typeof ugid === "number" ? ugid : (ugid != null ? Number(ugid) : undefined));
        })
        .catch((e) => {
          console.error("[getMod] failed:", e);
          message.error(e?.message || "โหลดข้อมูลม็อดไม่สำเร็จ");
        });
    }
  }, [modId]);

  // Form states
  const [modTitle, setModTitle] = useState("");
  const [modDescription, setModDescription] = useState("");
  const [modFile, setModFile] = useState<File | null>(null);
  const [modImage, setModImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // success banner (ลอยด้านบนจอ)
  const [showSuccess, setShowSuccess] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);

  // (ออปชัน) สำหรับ compatibility เดิม
  const [userGameId, setUserGameId] = useState<number | undefined>(undefined);

  // --- file handlers ---
  const handleModFile = (file: File) => {
    setModFile(file);
    message.success(`${file.name} selected`);
    return false; // stop auto-upload
  };
  const handleModFileChange: React.ComponentProps<typeof Upload>["onChange"] = (info) => {
    const f = info.file?.originFileObj as File | undefined;
    if (f) setModFile(f);
  };
  const handleModFileRemove = () => setModFile(null);

  const handleModImage = (file: File) => {
    setModImage(file);
    setImagePreview(URL.createObjectURL(file));
    message.success(`${file.name} selected`);
    return false;
  };
  const handleModImageChange: React.ComponentProps<typeof Upload>["onChange"] = (info) => {
    const f = info.file?.originFileObj as File | undefined;
    if (f) {
      setModImage(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };
  const handleModImageRemove = () => {
    setModImage(null);
    setImagePreview("");
  };

  const handleUpload = async () => {
    const toastKey = "modUpload";
    try {
      if (!gameId) {
        message.error("ไม่พบรหัสเกม");
        return;
      }
      if (!userId) {
        message.error("กรุณาเข้าสู่ระบบก่อนอัปโหลดม็อด");
        return;
      }
      if (!modTitle.trim()) {
        message.error("กรุณาใส่ชื่อม็อด");
        return;
      }

      if (!isEditing) {
        if (!modFile) {
          message.error("กรุณาเลือกไฟล์ม็อด");
          return;
        }

        setUploading(true);
        message.open({ key: toastKey, type: "loading", content: "กำลังอัปโหลด...", duration: 0 });

        const fd = new FormData();
        fd.append("title", modTitle);
        fd.append("description", modDescription);
        fd.append("game_id", String(gameId));
        fd.append("file", modFile);
        if (modImage) fd.append("image", modImage);

        await createMod(fd, token); // ควรคืน obj ก็ได้ แต่ไม่จำเป็นสำหรับการรีไดเรกต์ครั้งนี้
        message.open({ key: toastKey, type: "success", content: "อัปโหลดเรียบร้อยแล้ว!", duration: 0.8 });

        // แสดงแบนเนอร์สำเร็จ + รีไดเรกต์กลับ Workshop Detail
        setShowSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        redirectTimer.current = window.setTimeout(() => {
          navigate(`/workshop/${gameId}`, { replace: true });
        }, 1400);

        // reset ฟอร์ม
        setModTitle("");
        setModDescription("");
        setModFile(null);
        setModImage(null);
        setImagePreview("");
      } else {
        setUploading(true);
        message.open({ key: toastKey, type: "loading", content: "กำลังบันทึก...", duration: 0 });

        const payload: any = { title: modTitle, description: modDescription, game_id: gameId };
        if (userGameId != null) payload.user_game_id = userGameId;

        await updateMod(modId!, payload, token);

        message.open({ key: toastKey, type: "success", content: "บันทึกเรียบร้อยแล้ว!", duration: 0.8 });

        setShowSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        redirectTimer.current = window.setTimeout(() => {
          navigate(`/workshop/${gameId}`, { replace: true });
        }, 1200);
      }
    } catch (err: any) {
      console.error("[Upload] failed:", err);
      message.open({
        key: "modUpload",
        type: "error",
        content: err?.message || (isEditing ? "แก้ไขไม่สำเร็จ" : "อัปโหลดไม่สำเร็จ"),
        duration: 2.5,
      });
    } finally {
      setUploading(false);
    }
  };

  // cleanup timer เมื่อออกจากหน้า
  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        window.clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const disableSubmit = uploading;

  const checks = {
    gameId: !!gameId,
    title: !!modTitle.trim(),
    fileReady: isEditing ? true : !!modFile,
  };

  useEffect(() => {
    console.log("[Form check]", {
      gameId,
      title: checks.title,
      modFile: !!modFile,
      isEditing,
    });
  }, [gameId, modTitle, modFile, isEditing]);

  return (
    <div style={{ background: "#141414", minHeight: "100vh", flex: 1, position: "relative" }}>
      {/* === Success Banner (ลอยกึ่งกลางด้านบนจอ) === */}
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
            border: "1px solid #2b3a42",
            color: "#e5e7eb",
            padding: "10px 16px",
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <Space size="middle">
            <CheckCircleFilled style={{ color: "#52c41a", fontSize: 18 }} />
            <span style={{ fontWeight: 600 }}>
              {isEditing ? "บันทึกม็อดเรียบร้อย" : "อัปโหลดม็อดเรียบร้อย"}
            </span>
            <span style={{ color: "#9aa4ad" }}>กำลังกลับไปยังหน้า Workshop…</span>
          </Space>
        </div>
      )}

      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        <Title level={2} style={{ color: "white" }}>
          {game
            ? `${isEditing ? "Edit" : "Upload"} Mods for ${(game as any)?.game_name ?? (game as any)?.name ?? ""}`
            : "Upload Game Mods"}
        </Title>

        {/* รายละเอียดม็อด */}
        <Card
          title={
            <span style={{ color: "white" }}>
              <FileTextOutlined /> Mod Information
            </span>
          }
          style={{
            background: "#1f1f1f",
            marginBottom: "24px",
            borderRadius: 8,
            borderColor: "#404040",
          }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <Input
            placeholder="Your mods title"
            value={modTitle}
            onChange={(e) => setModTitle(e.target.value)}
            style={{
              background: "#2d2d2d",
              color: "white",
              borderColor: "#595959",
            }}
          />
        </Card>

        {!isEditing && (
          <>
            {/* เลือกไฟล์ม็อด */}
            <Card
              title={
                <span style={{ color: "white" }}>
                  <UploadOutlined /> Select your mods file
                </span>
              }
              style={{
                background: "#1f1f1f",
                marginBottom: "24px",
                borderRadius: 8,
                borderColor: "#404040",
              }}
              headStyle={{ color: "white", borderBottomColor: "#404040" }}
            >
              <Dragger
                beforeUpload={handleModFile}
                onChange={handleModFileChange}
                onRemove={handleModFileRemove}
                showUploadList={!!modFile}
                multiple={false}
                accept=".zip,.rar,.7z"
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: "#9254de" }} />
                </p>
                <p style={{ color: "white" }}>Click or drag mod file to this area</p>
                <p style={{ color: "#aaa" }}>รองรับ .zip, .rar, .7z</p>
              </Dragger>
              {modFile && (
                <p style={{ color: "white", marginTop: 8 }}>
                  Selected: {modFile.name}
                </p>
              )}
            </Card>

            {/* เลือกรูปม็อด (ออปชัน) */}
            <Card
              title={
                <span style={{ color: "white" }}>
                  <PictureOutlined /> Upload a mod image (optional)
                </span>
              }
              style={{
                background: "#1f1f1f",
                marginBottom: "24px",
                borderRadius: 8,
                borderColor: "#404040",
              }}
              headStyle={{ color: "white", borderBottomColor: "#404040" }}
            >
              <Dragger
                beforeUpload={handleModImage}
                onChange={handleModImageChange}
                onRemove={handleModImageRemove}
                showUploadList={!!modImage}
                accept="image/*"
                maxCount={1}
                multiple={false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: "#52c41a" }} />
                </p>
                <p style={{ color: "white" }}>Click or drag image to this area</p>
                <p style={{ color: "#aaa" }}>รองรับ .jpg, .png, .gif</p>
              </Dragger>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ marginTop: 12, maxHeight: 200, borderRadius: 6 }}
                />
              )}
            </Card>
          </>
        )}

        {/* คำอธิบาย */}
        <Card
          title={
            <span style={{ color: "white" }}>
              <FileTextOutlined /> Add a description
            </span>
          }
          style={{
            background: "#1f1f1f",
            marginBottom: "24px",
            borderRadius: 8,
            borderColor: "#404040",
          }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <Input.TextArea
            rows={4}
            placeholder="Use this space to describe your mods or what was involved in making it."
            value={modDescription}
            onChange={(e) => setModDescription(e.target.value)}
            style={{
              background: "#2d2d2d",
              color: "white",
              borderColor: "#595959",
            }}
          />
        </Card>

        {/* Checklist */}
        <Card
          title={<span style={{ color: "white" }}>Checklist</span>}
          style={{
            background: "#1f1f1f",
            marginBottom: 16,
            borderRadius: 8,
            borderColor: "#404040",
          }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <ul style={{ margin: 0, paddingLeft: 18, color: "white", lineHeight: 1.9 }}>
            <li><Ok ok={!!gameId} /> มีรหัสเกมใน URL (เช่น <code>?gameId=123</code>)</li>
            <li><Ok ok={!!modTitle.trim()} /> กรอกชื่อม็อด</li>
            {!isEditing && (
              <li><Ok ok={!!modFile} /> เลือกไฟล์ม็อด (.zip/.rar/.7z)</li>
            )}
          </ul>
        </Card>

        {/* ปุ่มอัปโหลด/บันทึก */}
        <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
          <Button
            type="primary"
            size="large"
            loading={uploading}
            disabled={uploading}
            style={{ background: "#9254de", borderColor: "#9254de" }}
            onClick={handleUpload}
          >
            {uploading
              ? isEditing
                ? "กำลังบันทึก..."
                : "กำลังอัปโหลด..."
              : isEditing
              ? "Save"
              : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;