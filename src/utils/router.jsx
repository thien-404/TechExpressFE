import { createBrowserRouter } from "react-router-dom";
// Layouts
import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";

// Common Pages
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
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
    path: "/admin", element: <AdminLayout />, children: [
      { index: true, element: <h2>Admin Home Page</h2> },
    ]
  }
]);