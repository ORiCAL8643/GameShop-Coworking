import { StrictMode } from "react"
import { createRoot } from 'react-dom/client'
import { App } from "antd";
import './index.css'
import router from "./routes/text.tsx"

import {
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <App>
        <RouterProvider router={router} />
        </App>
      </CartProvider>   
    </AuthProvider>
  </StrictMode>
)