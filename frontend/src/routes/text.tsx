// src/routes/text.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import AdminRoute from "../components/AdminRoute";

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
import ReportPage from "../pages/Report/ReportPage";
import ReportSuccessPage from "../pages/Report/ReportSuccess";

import PromotionManager from "../pages/Promotion/PromotionManager";
import PromotionDetail from "../pages/Promotion/PromotionDetail";

import RoleManagement from "../pages/role/RoleManagement";
import RoleEdit from "../pages/role/RoleEdit";

import RefundPage from "../pages/Refund/RefundPage";
import RefundStatusPage, { type Refund } from "../pages/Refund/RefundStatus";

import AdminPage from "../pages/Admin/AdminPage";
import AdminPaymentReviewPage from "../pages/Admin/AdminPaymentReviewPage";
import ResolvedReportsPage from "../pages/Admin/ResolvedReportPage"; // ✅ เพิ่ม import นี้

import OrdersStatusPage from "../pages/OrdersStatusPage";
import Reviewpage from "../pages/Review/Reviewpage.tsx";
import GameDetail from "../pages/Game/GameDetail";

// mock data (ถ้ามีอยู่แล้วที่อื่นจะลบส่วนนี้ออกได้)
const refunds: Refund[] = [
  { id: 1, orderId: "A001", user: "Alice", game: "Cyberpunk 2077", reason: "Buggy gameplay", status: "Pending" },
  { id: 2, orderId: "A002", user: "Bob", game: "Elden Ring", reason: "Accidental purchase", status: "Approved" },
];

// 🟣 Mock ฟังก์ชัน
const addNotification = (msg: string) => console.log("Notification:", msg);
const addRefundUpdate = (msg: string) => console.log("Refund update:", msg);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Sidebar />,
    children: [
      // === หน้าแรก
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },

      // ✅ Report
      { path: "report", element: <ReportPage /> },
      { path: "report/success", element: <ReportSuccessPage /> },

      // === กลุ่ม information
      { path: "information/Add", element: <AdminRoute need="admin:game"><Add /></AdminRoute> },
      { path: "information/Edit", element: <Edit /> },

      // === request
      { path: "request", element: <Request /> },
      { path: "requestinfo", element: <AdminRoute need="admin:request"><Requestinfo /></AdminRoute> },

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
      // ชี้หน้าอัปโหลดให้เป็นเส้นทางย่อยของ Workshop
      { path: "workshop/upload", element: <Workshop /> },
      
       { path: "game/:id", element: <GameDetail /> },

      // === promotion
      { path: "promotion", element: <AdminRoute need="admin:promotion"><PromotionManager /></AdminRoute> },
      { path: "promotion/:id", element: <AdminRoute need="admin:promotion"><PromotionDetail /></AdminRoute> },
      // === roles
      { path: "roles", element: <AdminRoute need="admin:role"><RoleManagement /></AdminRoute> },
      { path: "roles/:id", element: <AdminRoute need="admin:role"><RoleEdit /></AdminRoute> },

      // === refund
      { path: "refund", element: <RefundPage /> },
      { path: "refund-status", element: <RefundStatusPage refunds={refunds} /> },
      { path: "/promotion", element: <PromotionManager /> },
      { path: "/promotion/:id", element: <PromotionDetail /> },
      // Review page for a specific game
      { path: "/reviews/:gameId", element: <Reviewpage /> },


      // 🟣 Refund
      { path: "/refund", element: <RefundPage /> },
      { path: "/refund-status", element: <RefundStatusPage refunds={refunds} /> },

      // === admin
      {
        path: "Admin/Page",
        element: (
          <AdminRoute need="admin:page">
            <AdminPage
              refunds={refunds}
              setRefunds={() => { }}
              addNotification={addNotification}
              addRefundUpdate={addRefundUpdate}
            />
          </AdminRoute>
        ),
      },
      { path: "Admin/PaymentReviewPage", element: <AdminRoute need="admin:paymentreview"><AdminPaymentReviewPage /></AdminRoute> },

      { path: "Admin/RolePage", element: <AdminRoute need="admin:role"><RoleManagement /></AdminRoute> },

      // ✅ เพิ่มเส้นทางหน้ารายการที่แก้ไขแล้ว (ตรงกับปุ่ม navigate("/Admin/Resolved"))
      { path: "Admin/Resolved", element: <AdminRoute need="admin:page"><ResolvedReportsPage /></AdminRoute> },

      // === ✅ สถานะคำสั่งซื้อ (เส้นทางที่ต้องการ)
      { path: "orders-status", element: <OrdersStatusPage /> },

      // === fallback
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);

export default router;
