import React, { useState, useEffect } from "react";
import { Typography, Card, Input, Button, Upload, message } from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  PictureOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { getGame, listUserGames } from "../../services/workshop";
import type { Game, UserGame } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Title } = Typography;
const { Dragger } = Upload;

const API_URL = "http://localhost:8088";

const Workshop: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameIdParam = searchParams.get("gameId");
  const gameId = gameIdParam ? Number(gameIdParam) : undefined;

  const { id: userId } = useAuth();

  // Game + UserGame
  const [game, setGame] = useState<Game | null>(null);
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [userGameId, setUserGameId] = useState<number | null>(null);

  useEffect(() => {
    if (gameId) {
      getGame(gameId).then(setGame).catch(console.error);
    }
  }, [gameId]);

  useEffect(() => {
    if (!userId) return;
    listUserGames(userId)
      .then((rows) => {
        setUserGames(rows);
        if (gameId) {
          const found = rows.find((r) => r.game_id === gameId);
          setUserGameId(found ? found.ID : null);
        }
      })
      .catch(console.error);
  }, [userId, gameId]);

  // Form states
  const [modTitle, setModTitle] = useState("");
  const [modDescription, setModDescription] = useState("");
  const [modFile, setModFile] = useState<File | null>(null);
  const [modImage, setModImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // --- file handlers ---
  const handleModFile = (file: File) => {
    setModFile(file);
    message.success(`${file.name} selected`);
    return false; // stop auto-upload
  };
  const handleModFileChange: React.ComponentProps<typeof Upload>["onChange"] = (info) => {
    const f = info.file.originFileObj as File | undefined;
    if (f) setModFile(f);
  };
  const handleModFileRemove = () => {
    setModFile(null);
  };

  const handleModImage = (file: File) => {
    setModImage(file);
    setImagePreview(URL.createObjectURL(file));
    message.success(`${file.name} selected`);
    return false; // stop auto-upload
  };
  const handleModImageChange: React.ComponentProps<typeof Upload>["onChange"] = (info) => {
    const f = info.file.originFileObj as File | undefined;
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
    console.log("[Upload] clicked");
    const toastKey = "modUpload";
    try {
      if (!gameId) {
        message.error("ไม่พบรหัสเกม");
        return;
      }
      if (!modTitle.trim()) {
        message.error("กรุณาใส่ชื่อม็อด");
        return;
      }
      if (!modFile) {
        message.error("กรุณาเลือกไฟล์ม็อด");
        return;
      }
      if (userGameId == null) {
        message.error("คุณไม่มีเกมนี้ในคลัง จึงไม่สามารถอัปโหลดม็อดได้");
        return;
      }

      setUploading(true);
      message.open({ key: toastKey, type: "loading", content: "กำลังอัปโหลด...", duration: 0 });

      const fd = new FormData();
      fd.append("title", modTitle);
      fd.append("description", modDescription);
      fd.append("game_id", String(gameId));
      fd.append("user_game_id", String(userGameId));
      fd.append("mod_file", modFile);
      if (modImage) fd.append("image", modImage);

      console.log("[Upload] POST /mods", { gameId, userGameId, modTitle, hasImage: !!modImage });

      const res = await fetch(`${API_URL}/mods`, {
        method: "POST",
        body: fd, // อย่าตั้ง Content-Type เอง
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[Upload] server error:", res.status, text);
        throw new Error(text || `Upload failed (status ${res.status})`);
      }

      message.open({ key: toastKey, type: "success", content: "อัปโหลดเรียบร้อยแล้ว!", duration: 1.8 });

      // reset form
      setModTitle("");
      setModDescription("");
      setModFile(null);
      setModImage(null);
      setImagePreview("");
    } catch (err: any) {
      console.error("[Upload] failed:", err);
      message.open({
        key: toastKey,
        type: "error",
        content: err?.message || "อัปโหลดไม่สำเร็จ",
        duration: 2.5,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: "#141414", minHeight: "100vh", flex: 1 }}>
      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        <Title level={2} style={{ color: "white" }}>
          {game ? `Upload Mods for ${game.game_name}` : "Upload Game Mods"}
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
            <p style={{ color: "white", marginTop: 8 }}>Selected: {modFile.name}</p>
          )}
        </Card>

        {/* เลือกรูปม็อด */}
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

        {/* ปุ่มอัปโหลด */}
        <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
          <Button
            type="primary"
            size="large"
            loading={uploading}
            disabled={uploading}
            style={{ background: "#9254de", borderColor: "#9254de" }}
            onClick={handleUpload}
          >
            {uploading ? "กำลังอัปโหลด..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Workshop;
