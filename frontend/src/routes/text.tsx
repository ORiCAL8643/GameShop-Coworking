import Home from "../pages/Home.tsx";
import Request from "../pages/request.tsx";
import Edit from "../pages/information/Edit.tsx";
import Add from "../pages/information/Add.tsx";
import Requestinfo from "../pages/requestinfo.tsx";
import PaymentPage from "../components/Payment.tsx";
import CommunityPage from "../pages/Community/CommunityPage.tsx";
import { createBrowserRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar.tsx";
import "../styles/community-dark.css";
import WorkshopMain from "../pages/Workshop/MainPage.tsx";
import WorkshopDetail from "../pages/Workshop/WorkshopDetail.tsx";
import ModDetail from "../pages/Workshop/ModDetail.tsx";
import Workshop from "../pages/Workshop/UploadPage.tsx";
import RoleManagement from "../pages/role/RoleManagement.tsx";
// 🟣 Import เพิ่ม
import RefundPage from "../pages/Refund/RefundPage.tsx";
import RefundStatusPage, { type Refund } from "../pages/Refund/RefundStatus.tsx";
import AdminPage from "../pages/Admin/AdminPage.tsx";
import AdminPaymentReviewPage from "../pages/Admin/AdminPaymentReviewPage.tsx";
import PromotionManager from "../pages/Promotion/PromotionManager.tsx";
import RoleEdit from "../pages/role/RoleEdit.tsx";
import PromotionDetail from "../pages/Promotion/PromotionDetail.tsx";
import RequirePermission from "../components/RequirePermission.tsx";
// 🟣 Mock Refund Data
const refunds: Refund[] = [
  {
    id: 1,
    orderId: "A001",
    user: "Alice",
    game: "Cyberpunk 2077",
    reason: "Buggy gameplay",
    status: "Pending",
  },
  {
    id: 2,
    orderId: "A002",
    user: "Bob",
    game: "Elden Ring",
    reason: "Accidental purchase",
    status: "Approved",
  },
];

// 🟣 Mock ฟังก์ชัน
const addNotification = (msg: string) =>
  console.log("Notification:", msg);
const addRefundUpdate = (msg: string) =>
  console.log("Refund update:", msg);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Sidebar />,
    children: [
      { path: "/", element: <RequirePermission permission="games.read" />, children: [{ path: "/", element: <Home /> }] },
      { path: "/home", element: <RequirePermission permission="games.read" />, children: [{ path: "/home", element: <Home /> }] },

      { path: "/request", element: <RequirePermission permission="requests.create" />, children: [{ path: "/request", element: <Request /> }] },
      { path: "/requestinfo", element: <RequirePermission permission="requests.read" />, children: [{ path: "/requestinfo", element: <Requestinfo /> }] },

      {
        path: "/information",
        element: <RequirePermission permission="games.manage" />,
        children: [
          { path: "/information/Add", element: <Add /> },
          { path: "/information/Edit", element: <Edit /> },
        ],
      },

      { path: "/category/Community", element: <RequirePermission permission="community.read" />, children: [{ path: "/category/Community", element: <CommunityPage /> }] },
      { path: "/category/Payment", element: <RequirePermission permission="payments.create" />, children: [{ path: "/category/Payment", element: <PaymentPage /> }] },

      { path: "/workshop", element: <RequirePermission permission="workshop.read" />, children: [{ path: "/workshop", element: <WorkshopMain /> }] },
      { path: "/workshop/:id", element: <RequirePermission permission="workshop.read" />, children: [{ path: "/workshop/:id", element: <WorkshopDetail /> }] },
      { path: "/mod/:id", element: <RequirePermission permission="workshop.read" />, children: [{ path: "/mod/:id", element: <ModDetail /> }] },
      { path: "/upload", element: <RequirePermission permission="workshop.create" />, children: [{ path: "/upload", element: <Workshop /> }] },

      { path: "/promotion", element: <RequirePermission permission="promotions.manage" />, children: [{ path: "/promotion", element: <PromotionManager /> }] },
      { path: "/promotion/:id", element: <RequirePermission permission="promotions.read" />, children: [{ path: "/promotion/:id", element: <PromotionDetail /> }] },

      // 🟣 Refund
      { path: "/refund", element: <RequirePermission permission="refunds.manage" />, children: [{ path: "/refund", element: <RefundPage /> }] },
      { path: "/refund-status", element: <RequirePermission permission="refunds.read" />, children: [{ path: "/refund-status", element: <RefundStatusPage refunds={refunds} /> }] },

      // 🟣 Admin
      {
        path: "/Admin",
        element: <RequirePermission permission="roles.manage" />,
        children: [
          {
            path: "/Admin/Page",
            element: (
              <AdminPage
                refunds={refunds}
                setRefunds={() => { }}
                addNotification={addNotification}
                addRefundUpdate={addRefundUpdate}
              />
            ),
          },
          {
            path: "/Admin/PaymentReviewPage",
            element: <RequirePermission permission="payments.manage" />,
            children: [{ path: "/Admin/PaymentReviewPage", element: <AdminPaymentReviewPage /> }],
          },
          { path: "/Admin/RolePage", element: <RoleManagement /> },
        ],
      },
      { path: "/roles", element: <RequirePermission permission="roles.manage" />, children: [{ path: "/roles", element: <RoleManagement /> }] },
      { path: "/roles/:id", element: <RequirePermission permission="roles.manage" />, children: [{ path: "/roles/:id", element: <RoleEdit /> }] }
    ],
  },
]);

export default router;
