// src/pages/Workshop/UploadPage.tsx
import React, { useState, useEffect } from "react";
import { Typography, Card, Input, Button, Upload, message } from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  PictureOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import {
  getGame,
  listUserGames,
  getMod,
  createMod,
  updateMod,
} from "../../services/workshop";
import type { Game, UserGame } from "../../interfaces";
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
  const [searchParams] = useSearchParams();
  const gameIdParam = searchParams.get("gameId");
  const modIdParam = searchParams.get("modId");
  const gameId = gameIdParam ? Number(gameIdParam) : undefined;
  const modId = modIdParam ? Number(modIdParam) : undefined;

  // สมมติ useAuth() คืน id กับ token (ถ้าไม่มี token ก็ไม่เป็นไร)
  const { id: userId, token } = useAuth() as { id?: number; token?: string };

  // Game + UserGame
  const [game, setGame] = useState<Game | null>(null);
  const [, setUserGames] = useState<UserGame[]>([]);
  const [userGameId, setUserGameId] = useState<number | null>(null);

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
          const ugid = m?.user_game_id ?? m?.userGameId ?? m?.UserGameID ?? null;
          setUserGameId(typeof ugid === "number" ? ugid : (Number(ugid) || null));
        })
        .catch((e) => {
          console.error("[getMod] failed:", e);
          message.error(e?.message || "โหลดข้อมูลม็อดไม่สำเร็จ");
        });
    }
  }, [modId]);

  useEffect(() => {
    if (!userId) return;
    listUserGames(userId)
      .then((rows: any[]) => {
        console.log("[listUserGames] raw:", rows);
        setUserGames(Array.isArray(rows) ? rows : []);

        if (gameId) {
          const found = (rows ?? []).find(
            (r) => (r.game_id ?? r.gameId ?? r.GameID) === gameId
          );
          const ugid =
            found?.id ??
            found?.ID ??
            found?.Id ??
            found?.user_game_id ??
            found?.userGameId ??
            null;

          console.log("[resolve userGameId]", { gameId, found, ugid });
          setUserGameId(typeof ugid === "number" ? ugid : (Number(ugid) || null));
        }
      })
      .catch((e) => {
        console.error("[listUserGames] failed:", e);
        message.error(e?.message || "โหลดรายการเกมของฉันไม่สำเร็จ");
      });
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
    const f = info.file?.originFileObj as File | undefined;
    if (f) setModFile(f);
  };
  const handleModFileRemove = () => setModFile(null);

  const handleModImage = (file: File) => {
    setModImage(file);
    setImagePreview(URL.createObjectURL(file));
    message.success(`${file.name} selected`);
    return false; // stop auto-upload
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
    console.log("[Upload] clicked", {
      isEditing,
      gameId,
      userGameId,
      modTitle,
      hasFile: !!modFile,
      hasImage: !!modImage,
    });

    try {
      if (!gameId) {
        console.error("No gameId");
        message.error("ไม่พบรหัสเกม");
        return;
      }
      if (!modTitle.trim()) {
        console.error("No title");
        message.error("กรุณาใส่ชื่อม็อด");
        return;
      }

      if (!isEditing) {
        if (!modFile) {
          console.error("No mod file");
          message.error("กรุณาเลือกไฟล์ม็อด");
          return;
        }
        if (userGameId == null) {
          console.error("No userGameId");
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
        fd.append("file", modFile);
        if (modImage) fd.append("image", modImage);

        console.log("[Upload] POST /mods", { gameId, userGameId, modTitle, hasImage: !!modImage });

        await createMod(fd, token);

        message.open({ key: toastKey, type: "success", content: "อัปโหลดเรียบร้อยแล้ว!", duration: 1.8 });

        // reset form
        setModTitle("");
        setModDescription("");
        setModFile(null);
        setModImage(null);
        setImagePreview("");
      } else {
        setUploading(true);
        message.open({ key: toastKey, type: "loading", content: "กำลังบันทึก...", duration: 0 });

        const payload = {
          title: modTitle,
          description: modDescription,
          game_id: gameId,
          user_game_id: userGameId ?? undefined,
        };

        console.log("[Edit] PATCH /mods/:id", { modId, payload });

        await updateMod(modId!, payload, token);

        message.open({ key: toastKey, type: "success", content: "บันทึกเรียบร้อยแล้ว!", duration: 1.8 });
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

  // ปุ่มปิดเฉพาะตอนกำลังอัปโหลดเท่านั้น
  const disableSubmit = uploading;

  // Checklist แสดงสถานะฟอร์มให้เห็นชัด
  const checks = {
    gameId: !!gameId,
    title: !!modTitle.trim(),
    fileReady: isEditing ? true : !!modFile,
    owned: isEditing ? true : userGameId != null,
  };

  // Log เพื่อตรวจสภาพฟอร์มทุกครั้งที่เปลี่ยน
  useEffect(() => {
    console.log("[Form check]", {
      gameId,
      title: checks.title,
      modFile: !!modFile,
      userGameId,
      isEditing,
    });
  }, [gameId, modTitle, modFile, userGameId, isEditing]);

  return (
    <div style={{ background: "#141414", minHeight: "100vh", flex: 1 }}>
      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        <Title level={2} style={{ color: "white" }}>
          {game
            ? `${isEditing ? "Edit" : "Upload"} Mods for ${
                (game as any)?.game_name ?? (game as any)?.name ?? ""
              }`
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

        {/* Checklist แสดงสถานะฟอร์ม */}
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
              <>
                <li><Ok ok={!!modFile} /> เลือกไฟล์ม็อด (.zip/.rar/.7z)</li>
                <li><Ok ok={userGameId != null} /> มีเกมนี้ในคลัง (คุณเป็นเจ้าของเกมนี้)</li>
              </>
            )}
          </ul>
        </Card>

        {/* ปุ่มอัปโหลด/บันทึก */}
        <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
          <Button
            type="primary"
            size="large"
            loading={uploading}
            disabled={disableSubmit}
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
