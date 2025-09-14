// src/axios-setup.ts
import axios from "axios";

// ตั้ง baseURL กลาง (คำขอที่เป็น absolute URL จะไม่โดน baseURL ซ้ำ)
axios.defaults.baseURL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8088";

// แนบโทเค็น + (ออปชัน) X-User-ID อัตโนมัติทุกคำขอ
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const uid = localStorage.getItem("userid");

  // เผื่อ headers ยังไม่ได้สร้าง
  config.headers = config.headers ?? {};

  // แนบเฉพาะเมื่อยังไม่มี header เดิมถูกใส่มา
  if (token && !("Authorization" in config.headers)) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  if (uid && !("X-User-ID" in (config.headers as any))) {
    (config.headers as any)["X-User-ID"] = uid;
  }
  return config;
});

// (ออปชัน) จัดการ 401/403 ตรงนี้ ถ้าต้องการพฤติกรรมพิเศษ
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const s = err?.response?.status;
    // ตัวอย่าง: ถ้า 401 จะล้าง token/พากลับหน้า login
    // if (s === 401) { localStorage.clear(); window.location.href = "/home"; }
    return Promise.reject(err);
  }
);
