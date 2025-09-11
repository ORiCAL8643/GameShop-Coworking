// src/routes/text.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";

// pages
import Home from "../pages/Home";
import Request from "../pages/request";
import Edit from "../pages/information/Edit";
import Add from "../pages/information/Add";
import Requestinfo from "../pages/requestinfo";
import CommunityPage from "../pages/Community/CommunityPage";
import PaymentPage from "../components/Payment";
import WorkshopMain from "../pages/Workshop/MainPage";
import WorkshopDetail from "../pages/Workshop/WorkshopDetail";
import ModDetail from "../pages/Workshop/ModDetail";
import Workshop from "../pages/Workshop/UploadPage";

import PromotionManager from "../pages/Promotion/PromotionManager";
import PromotionDetail from "../pages/Promotion/PromotionDetail";

import RoleManagement from "../pages/role/RoleManagement";
import RoleEdit from "../pages/role/RoleEdit";

import RefundPage from "../pages/Refund/RefundPage";
import RefundStatusPage, { type Refund } from "../pages/Refund/RefundStatus";

import AdminPage from "../pages/Admin/AdminPage";
import AdminPaymentReviewPage from "../pages/Admin/AdminPaymentReviewPage";

import OrdersStatusPage from "../pages/OrdersStatusPage";

// mock data (ถ้ามีอยู่แล้วที่อื่นจะลบส่วนนี้ออกได้)
const refunds: Refund[] = [
  { id: 1, orderId: "A001", user: "Alice", game: "Cyberpunk 2077", reason: "Buggy gameplay", status: "Pending" },
  { id: 2, orderId: "A002", user: "Bob", game: "Elden Ring", reason: "Accidental purchase", status: "Approved" },
];

const addNotification = (msg: string) => console.log(msg);
const addRefundUpdate = (msg: string) => console.log(msg);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Sidebar />,
    children: [
      // === หน้าแรก
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },

      // === กลุ่ม information
      { path: "information/Add", element: <Add /> },
      { path: "information/Edit", element: <Edit /> },

      // === request
      { path: "request", element: <Request /> },
      { path: "requestinfo", element: <Requestinfo /> },

      // === category (ใช้ path แบบ relative)
      {
        path: "category",
        children: [
          { path: "Community", element: <CommunityPage /> },
          { path: "Payment", element: <PaymentPage /> },
        ],
      },

      // === workshop
      { path: "workshop", element: <WorkshopMain /> },
      { path: "workshop/:id", element: <WorkshopDetail /> },
      { path: "mod/:id", element: <ModDetail /> },
      { path: "upload", element: <Workshop /> },

      // === promotion
      { path: "promotion", element: <PromotionManager /> },
      { path: "promotion/:id", element: <PromotionDetail /> },

      // === roles
      { path: "roles", element: <RoleManagement /> },
      { path: "roles/:id", element: <RoleEdit /> },

      // === refund
      { path: "refund", element: <RefundPage /> },
      { path: "refund-status", element: <RefundStatusPage refunds={refunds} /> },

      // === admin
      {
        path: "Admin/Page",
        element: (
          <AdminPage
            refunds={refunds}
            setRefunds={() => {}}
            addNotification={addNotification}
            addRefundUpdate={addRefundUpdate}
          />
        ),
      },
      { path: "Admin/PaymentReviewPage", element: <AdminPaymentReviewPage /> },

      // === ✅ สถานะคำสั่งซื้อ (เส้นทางที่ต้องการ)
      { path: "orders-status", element: <OrdersStatusPage /> },

      // === fallback
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);

export default router;
