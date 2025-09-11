import Home from "../pages/Home";
import Request from "../pages/request";
import Edit from "../pages/information/Edit";
import Add from "../pages/information/Add";
import Requestinfo from "../pages/requestinfo";
import PaymentPage from "../components/Payment";
import CommunityPage from "../pages/Community/CommunityPage";
import { createBrowserRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/community-dark.css";
import WorkshopMain from "../pages/Workshop/MainPage";
import WorkshopDetail from "../pages/Workshop/WorkshopDetail";
import ModDetail from "../pages/Workshop/ModDetail";
import Workshop from "../pages/Workshop/UploadPage";
import RoleManagement from "../pages/role/RoleManagement";
import PromotionManager from "../pages/Promotion/PromotionManager";
import PromotionDetail from "../pages/Promotion/PromotionDetail";
import RoleEdit from "../pages/role/RoleEdit";
import RefundPage from "../pages/Refund/RefundPage";
import RefundStatusPage, { type Refund } from "../pages/Refund/RefundStatus";
import AdminPage from "../pages/Admin/AdminPage";
import AdminPaymentReviewPage from "../pages/Admin/AdminPaymentReviewPage";
import RequirePermission from "../components/RequirePermission";

const refunds: Refund[] = [
  { id: 1, orderId: "A001", user: "Alice", game: "Cyberpunk 2077", reason: "Buggy gameplay", status: "Pending" },
  { id: 2, orderId: "A002", user: "Bob", game: "Elden Ring", reason: "Accidental purchase", status: "Approved" },
];


const router = createBrowserRouter([
  {
    path: "/",
    element: <Sidebar />,
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "403", element: <div>403 Forbidden</div> },

      { path: "request", element: (
        <RequirePermission permission="requests.create"><Request /></RequirePermission>
      ) },
      { path: "requestinfo", element: (
        <RequirePermission permission="requests.read"><Requestinfo /></RequirePermission>
      ) },

      { path: "information/add", element: (
        <RequirePermission permission="games.manage"><Add /></RequirePermission>
      ) },
      { path: "information/edit", element: (
        <RequirePermission permission="games.manage"><Edit /></RequirePermission>
      ) },

      { path: "category/community", element: (
        <RequirePermission permission="community.read"><CommunityPage /></RequirePermission>
      ) },
      { path: "category/payment", element: (
        <RequirePermission permission="payments.create"><PaymentPage /></RequirePermission>
      ) },

      { path: "workshop", element: (
        <RequirePermission permission="workshop.read"><WorkshopMain /></RequirePermission>
      ) },
      { path: "workshop/:id", element: (
        <RequirePermission permission="workshop.read"><WorkshopDetail /></RequirePermission>
      ) },
      { path: "mod/:id", element: (
        <RequirePermission permission="workshop.read"><ModDetail /></RequirePermission>
      ) },
      { path: "upload", element: (
        <RequirePermission permission="workshop.create"><Workshop /></RequirePermission>
      ) },

      { path: "promotion", element: (
        <RequirePermission permission="promotions.manage"><PromotionManager /></RequirePermission>
      ) },
      { path: "promotion/:id", element: (
        <RequirePermission permission="promotions.read"><PromotionDetail /></RequirePermission>
      ) },

      { path: "refund", element: (
        <RequirePermission permission="refunds.manage"><RefundPage /></RequirePermission>
      ) },
      { path: "refund-status", element: (
        <RequirePermission permission="refunds.read"><RefundStatusPage refunds={refunds} /></RequirePermission>
      ) },

      { path: "Admin", element: (
        <RequirePermission permission="roles.manage"><AdminPage /></RequirePermission>
      ) },
      { path: "Admin/PaymentReviewPage", element: (
        <RequirePermission permission="payments.manage"><AdminPaymentReviewPage /></RequirePermission>
      ) },
      { path: "Admin/RolePage", element: (
        <RequirePermission permission="roles.manage"><RoleManagement /></RequirePermission>
      ) },

      { path: "roles", element: (
        <RequirePermission permission="roles.manage"><RoleManagement /></RequirePermission>
      ) },
      { path: "roles/:id", element: (
        <RequirePermission permission="roles.manage"><RoleEdit /></RequirePermission>
      ) },
    ],
  },
]);

export default router;
