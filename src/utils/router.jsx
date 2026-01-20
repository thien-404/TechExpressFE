import { createBrowserRouter } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout";
// ROOT



export const router = createBrowserRouter([
  {
    path: "/", element: <CustomerLayout />, children: [
      { index: true, element: <h2>Home Page</h2>},
    ]
  },
  {
    path: "/admin", element: <AdminLayout />, children: [
      { index: true, element: <h2>Admin Home Page</h2> },
    ]
  }
]);