import React, { useState } from "react";
import { Typography, Card, Input, Button, Upload, message } from "antd";
//import Navbar from "../components/Navbar";
import { UploadOutlined, FileTextOutlined, PictureOutlined, InboxOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";

const { Title } = Typography;
const { Dragger } = Upload;

interface WorkshopItem {
  id: string;
  title: string;
  items: number;
  image?: string;
}

// mock ข้อมูลเกมที่ user มี
const userGames: WorkshopItem[] = [
  { id: "1", title: "Counter Strike", items: 6 },
  { id: "2", title: "Half-Life", items: 3 },
];

const Workshop = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");
  const game = userGames.find((g) => g.id === gameId);

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

  const handleUpload = () => {
    if (!modTitle || !modFile) {
      message.error("กรุณาใส่ชื่อม็อดและเลือกไฟล์ม็อดก่อนอัปโหลด");
      return;
    }
    console.log("Title:", modTitle);
    console.log("Description:", modDescription);
    console.log("File:", modFile);
    console.log("Image:", modImage);

    message.success("อัปโหลดเรียบร้อยแล้ว!");
    setModTitle("");
    setModDescription("");
    setModFile(null);
    setModImage(null);
    setImagePreview("");
  };

  return (
    <div style={{ background: "#141414", minHeight: "100vh", flex: 1 }}>
      
      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        <Title level={2} style={{ color: "white" }}>
          {game ? `Upload Mods for ${game.title}` : "Upload Game Mods"}
        </Title>

        {/* ชื่อม็อด */}
        <Card
          title={
            <span style={{ color: "white" }}>
              <FileTextOutlined /> Give your mods a title
            </span>
          }
          style={{ background: "#1f1f1f", marginBottom: "24px", borderRadius: 8, borderColor: "#404040" }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <Input
            placeholder="Your mods title"
            value={modTitle}
            onChange={(e) => setModTitle(e.target.value)}
            style={{ background: "#2d2d2d", color: "white", borderColor: "#595959" }}
          />
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
          <Dragger beforeUpload={handleModFile} showUploadList={false}>
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
          <Dragger beforeUpload={handleModImage} showUploadList={false} accept="image/*">
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
          style={{ background: "#1f1f1f", marginBottom: "24px", borderRadius: 8, borderColor: "#404040" }}
          headStyle={{ color: "white", borderBottomColor: "#404040" }}
        >
          <Input.TextArea
            rows={4}
            placeholder="Use this space to describe your mods or what was involved in making it."
            value={modDescription}
            onChange={(e) => setModDescription(e.target.value)}
            style={{ background: "#2d2d2d", color: "white", borderColor: "#595959" }}
          />
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
