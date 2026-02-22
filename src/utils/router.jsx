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
import CategoryPage from "../pages/admin/Categories/CategoryPage.jsx";
import UserUpdatePage from "../pages/admin/Users/UserUpdatePage.jsx";
import StaffCreatePage from "../pages/admin/Users/StaffCreatePage.jsx";
import ProductPage from "../pages/admin/Product/ProductPage.jsx";
import ProductDetailPage from "../pages/admin/Product/ProductDetailPage.jsx";
import ProductCreatePage from "../pages/admin/Product/ProductCreatePage.jsx";
import ProductUpdatePage from "../pages/admin/Product/ProductUpdatePage.jsx";

//Customer Pages
import AccountPage from "../pages/customer/account/AccountPage.jsx";
import HomePage from "../pages/customer/HomePage.jsx";
import CartPage from "../pages/customer/CartPage.jsx";
import CategoryDetailsPage from "../pages/admin/Categories/CategoryDetailsPage.jsx";
import BrandPage from "../pages/admin/Brands/BrandPage.jsx";


export const router = createBrowserRouter([
  {
    path: "/", element: <CustomerLayout />, children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "account", element: <ProtectedRoute><AccountPage /></ProtectedRoute> },
      { path: "cart", element: <CartPage /> }
    ]
  },
  {
    path: "/admin", element: <ProtectedRoute requiredRole="Admin"><AdminLayout /></ProtectedRoute>, children: [
      { index: true, element: <h2>Admin Home Page</h2> },
      // User Management
      { path: "users", element: <UserPage />},
      { path: "users/:userId", element: <UserDetailPage /> },
      { path: "users/:userId/edit", element: <UserUpdatePage /> },
      { path: "staff/create", element: <StaffCreatePage /> },

      // Category Management
      { path: "categories", element: <CategoryPage /> },
      { path: "categories/:categoryId", element: <CategoryDetailsPage/>},

      { path: "brands", element: <BrandPage/>},

      // Product Management
      { path: "products", element: <ProductPage /> },
      { path: "products/create", element: <ProductCreatePage /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "products/:productId/edit", element: <ProductUpdatePage /> },
    ]
  }
]);
