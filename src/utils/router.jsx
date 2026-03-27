import { createBrowserRouter, Navigate } from "react-router-dom";

import CartAccessRoute from "../components/auth/CartAccessRoute.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";
import StaffLayout from "../layouts/StaffLayout.jsx";

import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/ResetPasswordPage.jsx";

import UserPage from "../pages/admin/Users/UserPage.jsx";
import UserDetailPage from "../pages/admin/Users/UserDetailPage.jsx";
import CategoryPage from "../pages/admin/Categories/CategoryPage.jsx";
import UserUpdatePage from "../pages/admin/Users/UserUpdatePage.jsx";
import StaffCreatePage from "../pages/admin/Users/StaffCreatePage.jsx";
import ProductPage from "../pages/admin/Product/ProductPage.jsx";
import ProductDetailPage from "../pages/admin/Product/ProductDetailPage.jsx";
import ProductCreatePage from "../pages/admin/Product/ProductCreatePage.jsx";
import PcCreatePage from "../pages/admin/Product/PcCreatePage.jsx";
import ProductUpdatePage from "../pages/admin/Product/ProductUpdatePage.jsx";
import PromotionPage from "../pages/admin/Promotions/PromotionPage.jsx";
import PromotionCreatePage from "../pages/admin/Promotions/PromotionCreatePage.jsx";
import PromotionDetailPage from "../pages/admin/Promotions/PromotionDetailPage.jsx";
import OrderPage from "../pages/admin/Order/OrderPage.jsx";
import OrderDetailPage from "../pages/admin/Order/OrderDetailPage.jsx";
import AdminChatPage from "../pages/admin/Chat/AdminChatPage.jsx";
import CategoryDetailsPage from "../pages/admin/Categories/CategoryDetailsPage.jsx";
import BrandPage from "../pages/admin/Brands/BrandPage.jsx";
import AdminTicketPage from "../pages/admin/Ticket/TicketPage.jsx";
import AdminTicketDetailPage from "../pages/admin/Ticket/TicketDetailPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";

import StaffProductPage from "../pages/staff/Product/ProductPage.jsx";
import StaffProductDetailPage from "../pages/staff/Product/ProductDetailPage.jsx";
import StaffOrderPage from "../pages/staff/Order/OrderPage.jsx";
import StaffOrderDetailPage from "../pages/staff/Order/OrderDetailPage.jsx";
import StaffPromotionPage from "../pages/staff/Promotions/PromotionPage.jsx";
import StaffPromotionDetailPage from "../pages/staff/Promotions/PromotionDetailPage.jsx";
import StaffTicketPage from "../pages/staff/Ticket/TicketPage.jsx";
import StaffTicketDetailPage from "../pages/staff/Ticket/TicketDetailPage.jsx";

import AccountPage from "../pages/customer/account/AccountPage.jsx";
import HomePage from "../pages/customer/HomePage.jsx";
import CategoriesPage from "../pages/customer/CategoriesPage.jsx";
import ProductListingPage from "../pages/customer/product/ProductListingPage.jsx";
import CartPage from "../pages/customer/CartPage.jsx";
import CheckoutPage from "../pages/customer/CheckoutPage.jsx";
import CustomerProductDetailPage from "../pages/customer/product/ProductDetailPage.jsx";
import ProductSearchPage from "../pages/customer/product/ProductSearchPage.jsx";
import CustomPcBuilderPage from "../pages/customer/CustomPcBuilderPage.jsx";
import CustomerPromotionPage from "../pages/customer/promotion/PromotionPage.jsx";
import CustomerPromotionDetailPage from "../pages/customer/promotion/PromotionDetailPage.jsx";
import SupportPage from "../pages/customer/SupportPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <CustomerLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "products", element: <ProductListingPage /> },
      { path: "account", element: <ProtectedRoute><AccountPage /></ProtectedRoute> },
      { path: "cart", element: <CartAccessRoute><CartPage /></CartAccessRoute> },
      { path: "checkout", element: <CartAccessRoute><CheckoutPage /></CartAccessRoute> },
      { path: "custom-pc-builder", element: <CustomPcBuilderPage /> },
      { path: "promotions", element: <CustomerPromotionPage /> },
      { path: "promotions/:promotionId", element: <CustomerPromotionDetailPage /> },
      { path: "products/search", element: <ProductSearchPage /> },
      { path: "products/:productId", element: <CustomerProductDetailPage /> },
      { path: "support", element: <SupportPage /> },
    ],
  },
  {
    path: "/admin",
    element: <ProtectedRoute requiredRole="Admin"><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboardPage /> },
      { path: "users", element: <UserPage /> },
      { path: "users/:userId", element: <UserDetailPage /> },
      { path: "users/:userId/edit", element: <UserUpdatePage /> },
      { path: "staff/create", element: <StaffCreatePage /> },
      { path: "categories", element: <CategoryPage /> },
      { path: "categories/:categoryId", element: <CategoryDetailsPage /> },
      { path: "brands", element: <BrandPage /> },
      { path: "products", element: <ProductPage /> },
      { path: "products/create", element: <ProductCreatePage /> },
      { path: "products/pc-create", element: <PcCreatePage /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "products/:productId/edit", element: <ProductUpdatePage /> },
      { path: "promotions", element: <PromotionPage /> },
      { path: "promotions/create", element: <PromotionCreatePage /> },
      { path: "promotions/:promotionId", element: <PromotionDetailPage /> },
      { path: "orders", element: <OrderPage /> },
      { path: "orders/:orderId", element: <OrderDetailPage /> },
      { path: "chat", element: <AdminChatPage /> },
      { path: "tickets", element: <AdminTicketPage /> },
      { path: "tickets/:ticketId", element: <AdminTicketDetailPage /> },
    ],
  },
  {
    path: "/staff",
    element: <ProtectedRoute requiredRole="Staff"><StaffLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/staff/orders" replace /> },
      { path: "products", element: <StaffProductPage /> },
      { path: "products/:productId", element: <StaffProductDetailPage /> },
      { path: "orders", element: <StaffOrderPage /> },
      { path: "orders/:orderId", element: <StaffOrderDetailPage /> },
      { path: "promotions", element: <StaffPromotionPage /> },
      { path: "promotions/:promotionId", element: <StaffPromotionDetailPage /> },
      { path: "tickets", element: <StaffTicketPage /> },
      { path: "tickets/:ticketId", element: <StaffTicketDetailPage /> },
    ],
  },
]);
