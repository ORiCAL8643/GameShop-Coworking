import Home from '../pages/Home.tsx'
import Request from "../pages/request.tsx"
import Edit from "../pages/information/Edit.tsx"
import Add from "../pages/information/Add.tsx"
import Requestinfo from '../pages/requestinfo.tsx'
import PaymentPage from '../components/Payment.tsx'
import CommunityPage from '../pages/Community/CommunityPage.tsx'
import { createBrowserRouter } from "react-router-dom";
import Sidebar from '../components/Sidebar.tsx'
import "../styles/community-dark.css"
import WorkshopMain from '../pages/Workshop/MainPage.tsx'
import WorkshopDetail from '../pages/Workshop/WorkshopDetail.tsx'
import ModDetail from '../pages/Workshop/ModDetail.tsx'
import Workshop from '../pages/Workshop/UploadPage.tsx'

// 👇 เพิ่ม import ของระบบ Role
import RoleManagement from '../pages/role/RoleManagement.tsx'
import RoleEdit from '../pages/role/RoleEdit.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Sidebar />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/request",
        element: <Request />,
      },
      {
        path: "/requestinfo",
        element: <Requestinfo />,
      },
      {
        path: "/information",
        children: [
          {
            path: "/information/Add",
            element: <Add />,
          },
          {
            path: "/information/Edit",
            element: <Edit />,
          },
        ],
      },
      {
        path: "/category",
        children: [
          {
            path: "/category/Community",
            element: <CommunityPage />,
          },
          {
            path: "/category/Payment",
            element: <PaymentPage />,
          },
        ],
      },

      // 👇 เส้นทางของระบบ Role
      {
        path: "/roles",
        element: <RoleManagement />,
      },
      {
        path: "/roles/:id",
        element: <RoleEdit />,
      },

      {
        path: "/workshop",
        element: <WorkshopMain />,
      },
      {
        path: "/workshop/:title",
        element: <WorkshopDetail />,
      },
      {
        path: "/mod/:title",
        element: <ModDetail />,
      },
      {
        path: "/upload",
        element: <Workshop />,
      },
    ],
  },
]);

export default router;
