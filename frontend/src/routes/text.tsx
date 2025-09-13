// src/routes/text.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Forbidden from "../pages/Forbidden";

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

const GuardedRoute: React.FC<{ needed: string; element: JSX.Element }> = ({ needed, element }) => {
  const { hasPerm } = useAuth();
  return hasPerm(needed) ? element : <Navigate to="/403" replace />;
};

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
      // ชี้หน้าอัปโหลดให้เป็นเส้นทางย่อยของ Workshop
      { path: "workshop/upload", element: <Workshop /> },
      
       { path: "game/:id", element: <GameDetail /> },

      // === promotion
      { path: "promotion", element: <PromotionManager /> },
      { path: "promotion/:id", element: <PromotionDetail /> },
      // === roles
      { path: "roles", element: <GuardedRoute needed="role.read" element={<RoleManagement />} /> },
      { path: "roles/:id", element: <GuardedRoute needed="role.update" element={<RoleEdit />} /> },

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
          <AdminPage
            refunds={refunds}
            setRefunds={() => { }}
            addNotification={addNotification}
            addRefundUpdate={addRefundUpdate}
          />
        ),
      },
      { path: "Admin/PaymentReviewPage", element: <AdminPaymentReviewPage /> },

      { path: "Admin/RolePage", element: <RoleManagement /> },

      // ✅ เพิ่มเส้นทางหน้ารายการที่แก้ไขแล้ว (ตรงกับปุ่ม navigate("/Admin/Resolved"))
      { path: "Admin/Resolved", element: <ResolvedReportsPage /> },

      // === ✅ สถานะคำสั่งซื้อ (เส้นทางที่ต้องการ)
      { path: "orders-status", element: <OrdersStatusPage /> },

      // === fallback
      { path: "403", element: <Forbidden /> },
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);

export default router;
