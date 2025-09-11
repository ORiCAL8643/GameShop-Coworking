import { StrictMode } from "react"
import { createRoot } from 'react-dom/client'
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
        <RouterProvider router={router} />
      </CartProvider>   
    </AuthProvider>
  </StrictMode>
)