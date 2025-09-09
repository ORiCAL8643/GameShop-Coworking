import React, { useState, useEffect } from "react";
import { Typography, Card, Input, Button, Upload, message, Form } from "antd";
import { UploadOutlined, FileTextOutlined, PictureOutlined, InboxOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { getGame, createMod, listUserGames } from "../../services/workshop";
import { useAuth } from "../../context/AuthContext";
import type { Game } from "../../interfaces";

const { Title } = Typography;
const { Dragger } = Upload;

const Workshop = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");
  const [game, setGame] = useState<Game | null>(null);
  const { id: userId } = useAuth();
  const [userGameId, setUserGameId] = useState<number | null>(null);

  useEffect(() => {
    if (gameId) {
      getGame(Number(gameId)).then(setGame).catch(console.error);
    }
    if (userId) {
      listUserGames(userId)
        .then((rows) => {
          const ug = rows.find((r) => r.game_id === Number(gameId));
          if (ug) setUserGameId(ug.ID);
        })
        .catch(console.error);
    }
  }, [gameId, userId]);

  // State
  const [modTitle, setModTitle] = useState("");
  const [modDescription, setModDescription] = useState("");
  const [modFile, setModFile] = useState<File | null>(null);
  const [modImage, setModImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // File handlers
  const handleModFile = (file: File) => {
    setModFile(file);
    message.success(`${file.name} selected`);
    return false; // prevent auto upload
  };

  const handleModImage = (file: File) => {
    setModImage(file);
    setImagePreview(URL.createObjectURL(file));
    message.success(`${file.name} selected`);
    return false; // prevent auto upload
  };

  const handleUpload = async () => {
    if (!modTitle || !modFile || !gameId || !userGameId) {
      message.error("กรุณาใส่ข้อมูลให้ครบและเลือกไฟล์ม็อดก่อนอัปโหลด");
      return;
    }
    const formData = new FormData();
    formData.append("title", modTitle);
    formData.append("description", modDescription);
    formData.append("game_id", String(gameId));
    formData.append("user_game_id", String(userGameId));
    formData.append("file", modFile);
    if (modImage) formData.append("image", modImage);
    try {
      await createMod(formData);
      message.success("อัปโหลดเรียบร้อยแล้ว!");
      setModTitle("");
      setModDescription("");
      setModFile(null);
      setModImage(null);
      setImagePreview("");
    } catch (err: any) {
      message.error(err.message);
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
          style={{ background: "#1f1f1f", marginBottom: "24px", borderRadius: 8, borderColor: "#404040" }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <Form layout="vertical">
            <Form.Item label={<span style={{ color: "white" }}>Title</span>}>
              <Input
                placeholder="Your mods title"
                value={modTitle}
                onChange={(e) => setModTitle(e.target.value)}
                style={{ background: "#2d2d2d", color: "white", borderColor: "#595959" }}
              />
            </Form.Item>
            <Form.Item label={<span style={{ color: "white" }}>Description</span>}>
              <Input.TextArea
                rows={4}
                placeholder="Use this space to describe your mods or what was involved in making it."
                value={modDescription}
                onChange={(e) => setModDescription(e.target.value)}
                style={{ background: "#2d2d2d", color: "white", borderColor: "#595959" }}
              />
            </Form.Item>
          </Form>
        </Card>

        {/* เลือกไฟล์ม็อด */}
        <Card
          title={
            <span style={{ color: "white" }}>
              <UploadOutlined /> Select your mods file
            </span>
          }
          style={{ background: "#1f1f1f", marginBottom: "24px", borderRadius: 8, borderColor: "#404040" }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <Dragger
            beforeUpload={handleModFile}
            showUploadList={false}
            style={{ background: "#2d2d2d", height: 150 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: "#9254de" }} />
            </p>
            <p style={{ color: "white" }}>Click or drag mod file to this area</p>
            <p style={{ color: "#aaa" }}>รองรับ .zip, .rar, .7z</p>
          </Dragger>
          {modFile && <p style={{ color: "white", marginTop: 8 }}>Selected: {modFile.name}</p>}
        </Card>

        {/* เลือกรูปม็อด */}
        <Card
          title={
            <span style={{ color: "white" }}>
              <PictureOutlined /> Upload a mod image
            </span>
          }
          style={{ background: "#1f1f1f", marginBottom: "24px", borderRadius: 8, borderColor: "#404040" }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <Dragger
            beforeUpload={handleModImage}
            showUploadList={false}
            accept="image/*"
            style={{ background: "#2d2d2d", height: 150 }}
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

        {/* ปุ่มอัปโหลด */}
        <div style={{ textAlign: "right" }}>
          <Button
            type="primary"
            size="large"
            style={{ background: "#9254de", borderColor: "#9254de" }}
            onClick={handleUpload}
          >
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Workshop;
