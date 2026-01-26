import { createBrowserRouter } from "react-router-dom";
// Layouts
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";

// Common Pages
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";

// Admin Pages
import UserPage from "../pages/admin/Users/UserPage.jsx";
import UserDetailPage from "../pages/admin/Users/UserDetailPage.jsx";
//Customer Pages



export const router = createBrowserRouter([
  {
    path: "/", element: <CustomerLayout />, children: [
      { index: true, element: <h2>Home Page</h2>},
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> }
    ]
  },
  {
    path: "/admin", element: <ProtectedRoute requiredRole="Admin"><AdminLayout /></ProtectedRoute>, children: [
      { index: true, element: <h2>Admin Home Page</h2> },
      { path: "users", element: <UserPage />},
      { path: "users/:userId", element: <UserDetailPage /> }
    ]
  }
]);