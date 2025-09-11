import { Select, Layout, Image, Typography, Col, Row, Space, Input, Button, Upload, message } from "antd";
import Navbar from "../../components/Navbar";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";

const { Title } = Typography;

const base_url = "http://localhost:8088";

const Add = () => {
  interface Category {
    ID: number;
    title: string;
  }

  const [categories, setcategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [gameName, setGameName] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);

  // แยกเป็น 2 ตัว: url สำหรับ preview และ path สำหรับส่งให้ backend
  const [imgUrl, setImgUrl] = useState(
    "https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small_2x/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg",
  );
  const [imgPath, setImgPath] = useState<string>("");

  // Minimum Spec form
  const [os, setOs] = useState("");
  const [processor, setProcessor] = useState("");
  const [memory, setMemory] = useState("");
  const [graphics, setGraphics] = useState("");
  const [storage, setStorage] = useState("");

  async function uploadGameImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axios.post(`${base_url}/upload/game`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // backend คืน { url: "/uploads/games/xxx.png" }
    return res.data.url as string;
  }

  const handleUpload: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    try {
      const path = await uploadGameImage(file as File);
      setImgPath(path);
      setImgUrl(base_url + path); // โชว์รูปแบบเต็ม
      onSuccess?.({}, new XMLHttpRequest());
      message.success("อัปโหลดสำเร็จ");
    } catch (e) {
      onError?.(e as any);
      message.error("อัปโหลดล้มเหลว");
    }
  };

  async function GetCategories() {
    try {
      const response = await axios.get(`${base_url}/categories`);
      setcategories(response.data);
    } catch (err) {
      console.log("get categories error", err);
      message.error("โหลดหมวดหมู่ไม่สำเร็จ");
    }
  }

  useEffect(() => {
    GetCategories();
  }, []);

  // ► สร้าง MinimumSpec แล้วคืน id
  async function createMinimumSpec(): Promise<number> {
    const res = await axios.post(`${base_url}/new-minimumspec`, {
      os,
      processor,
      memory,
      graphics,
      storage,
    });
    const id = res.data?.ID ?? res.data?.id;
    if (!id) throw new Error("ไม่พบรหัส MinimumSpec ที่เพิ่งสร้าง");
    return Number(id);
  }

  // ► สร้างเกม โดยรับ minSpecId จากฟังก์ชันข้างบน
  async function createGame(minSpecId: number) {
    const res = await axios.post(`${base_url}/new-game`, {
      game_name: gameName,
      base_price: price,
      age_rating: age,
      img_src: imgPath || "", // ส่ง 'path' ให้ backend (ไม่ใช่ URL เต็ม)
      minimum_spec_id: minSpecId,
      categories_id: categoryId,
    });
    return res.data;
  }

  async function handleSubmit() {
    // validate เบื้องต้น
    if (!gameName.trim()) return message.warning("กรุณากรอกชื่อเกม");
    if (price == null || isNaN(price)) return message.warning("กรุณากรอกราคาให้ถูกต้อง");
    if (age == null || isNaN(age)) return message.warning("กรุณากรอกอายุให้ถูกต้อง");
    if (!categoryId) return message.warning("กรุณาเลือกหมวดหมู่");

    try {
      // 1) สร้าง MinimumSpec และรับ id
      const minSpecId = await createMinimumSpec();

      // 2) ใช้ id นั้นไปสร้าง Game
      const created = await createGame(minSpecId);

      message.success("เพิ่มเกมสำเร็จ");
      console.log("เพิ่มเกมสำเร็จ:", created);

      // reset บางส่วน
      // setM_id ไม่จำเป็นแล้ว เพราะเราใช้ id จริงจาก backend
      setGameName("");
      setPrice(null);
      setAge(null);
      setCategoryId(null);
      setImgPath("");
      setImgUrl(
        "https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small_2x/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg",
      );
      setOs("");
      setProcessor("");
      setMemory("");
      setGraphics("");
      setStorage("");
    } catch (err) {
      const ax = err as AxiosError<any>;
      console.log("add game error", err);
      const msg =
        ax.response?.data?.error ||
        ax.response?.data?.message ||
        ax.message ||
        "เพิ่มเกมล้มเหลว";
      message.error(msg);
    }
  }

  return (
    <Layout>
      <Layout style={{ background: "#141414", flex: 1, minHeight: "100vh" }}>
        <div style={{ padding: "10px" }}>
          <Navbar />
          <div
            style={{
              background: "linear-gradient(90deg, #9254de 0%, #f759ab 100%)",
              height: 180,
              borderRadius: 10,
              marginBottom: 24,
            }}
          />
          <Title level={3} style={{ color: "white" }}>
            Add
          </Title>

          <Row style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Space>
                <PlusOutlined style={{ background: "#141414", color: "#d6d6d6ff" }} />
                <span style={{ color: "#d6d6d6ff" }}>ชื่อ</span>
              </Space>
              <br />
              <br />
              <Input
                placeholder="กรุณากรอกชื่อเกม"
                style={{ width: 500 }}
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
              <br />
              <br />
              <br />
              <Space>
                <PlusOutlined style={{ background: "#141414", color: "#d6d6d6ff" }} />
                <span style={{ color: "#d6d6d6ff" }}>ราคา</span>
              </Space>
              <br />
              <br />
              <Input
                style={{ width: 120 }}
                value={price ?? ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                type="number"
                min={0}
              />
              <br />
              <br />
              <br />
              <Space>
                <PlusOutlined style={{ background: "#141414", color: "#d6d6d6ff" }} />
                <span style={{ color: "#d6d6d6ff" }}>อายุ</span>
              </Space>
              <br />
              <br />
              <Input
                style={{ width: 120 }}
                value={age ?? ""}
                onChange={(e) => setAge(Number(e.target.value))}
                type="number"
                min={0}
              />
              <br />
              <br />
              <br />
              <Space>
                <PlusOutlined style={{ background: "#141414", color: "#d6d6d6ff" }} />
                <span style={{ color: "#d6d6d6ff" }}>หมวดหมู่</span>
              </Space>
              <br />
              <br />
              <Select
                placeholder="เลือกหมวดหมู่"
                style={{ width: 500 }}
                options={categories.map((c) => ({ value: c.ID, label: c.title }))}
                value={categoryId ?? undefined}
                onChange={(val) => setCategoryId(val)}
              />
            </Col>

            <Col span={12}>
              <Image
                src={imgUrl || "https://via.placeholder.com/750x300?text=Preview"}
                width={750}
                height={300}
                style={{ objectFit: "cover", background: "#eee" }}
                preview={false}
              />
              <br />
              <br />
              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                customRequest={handleUpload}
              >
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </Col>
          </Row>

          <Row>
            <Col span={12}>
              <Space>
                <PlusOutlined style={{ background: "#141414", color: "#d6d6d6ff" }} />
                <span style={{ color: "#d6d6d6ff" }}>Minimum Spec</span>
              </Space>
            </Col>
          </Row>

          <Row style={{ marginTop: 12 }}>
            <Col>
              <Layout
                style={{ background: "#ffc18fff", height: 500, borderRadius: 10, marginBottom: 24 }}
              >
                <Row style={{ marginLeft: 24, marginTop: 24 }}>
                  <Col span={12}>
                    <Space>
                      <PlusOutlined style={{ background: "#ffc18fff", color: "#000000ff" }} />
                      <span style={{ color: "#000000ff" }}>OS</span>
                    </Space>
                  </Col>
                  <br />
                  <br />
                  <Input
                    placeholder="-"
                    style={{ width: 500 }}
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                  />
                </Row>

                <Row style={{ marginLeft: 24, marginTop: 12 }}>
                  <Col span={12}>
                    <Space>
                      <PlusOutlined style={{ background: "#ffc18fff", color: "#000000ff" }} />
                      <span style={{ color: "#000000ff" }}>Processor</span>
                    </Space>
                  </Col>
                  <br />
                  <br />
                  <Input
                    placeholder="-"
                    style={{ width: 500 }}
                    value={processor}
                    onChange={(e) => setProcessor(e.target.value)}
                  />
                </Row>

                <Row style={{ marginLeft: 24, marginTop: 12 }}>
                  <Col span={12}>
                    <Space>
                      <PlusOutlined style={{ background: "#ffc18fff", color: "#000000ff" }} />
                      <span style={{ color: "#000000ff" }}>Memory</span>
                    </Space>
                  </Col>
                  <br />
                  <br />
                  <Input
                    placeholder="-"
                    style={{ width: 500 }}
                    value={memory}
                    onChange={(e) => setMemory(e.target.value)}
                  />
                </Row>

                <Row style={{ marginLeft: 24, marginTop: 12 }}>
                  <Col span={12}>
                    <Space>
                      <PlusOutlined style={{ background: "#ffc18fff", color: "#000000ff" }} />
                      <span style={{ color: "#000000ff" }}>Graphics</span>
                    </Space>
                  </Col>
                  <br />
                  <br />
                  <Input
                    placeholder="-"
                    style={{ width: 500 }}
                    value={graphics}
                    onChange={(e) => setGraphics(e.target.value)}
                  />
                </Row>

                <Row style={{ marginLeft: 24, marginBottom: 24, marginTop: 12 }}>
                  <Col span={12}>
                    <Space>
                      <PlusOutlined style={{ background: "#ffc18fff", color: "#000000ff" }} />
                      <span style={{ color: "#000000ff" }}>Storage</span>
                    </Space>
                  </Col>
                  <br />
                  <br />
                  <Input
                    placeholder="-"
                    style={{ width: 500 }}
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                  />
                </Row>
              </Layout>
            </Col>
          </Row>

          <Row style={{ marginTop: 12 }}>
            <Col offset={23}>
              <Button type="primary" onClick={handleSubmit}>
                ยืนยัน
              </Button>
            </Col>
          </Row>
        </div>
      </Layout>
    </Layout>
  );
};

export default Add;
