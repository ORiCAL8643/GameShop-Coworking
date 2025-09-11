import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import router from "./routes/text";          // ไม่ต้องใส่ .tsx ก็ได้
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";   // ⬅️ เพิ่มบรรทัดนี้
import { App as AntdApp } from "antd";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AntdApp>
      <AuthProvider>
        <CartProvider>                           {/* ⬅️ ครอบ Router ด้วย CartProvider */}
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </AntdApp>
  </StrictMode>
);
