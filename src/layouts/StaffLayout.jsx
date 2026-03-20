import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import StaffTopBar from "../components/ui/StaffTopBar.jsx";
import StaffSideBar from "../components/ui/StaffSideBar.jsx";

export default function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative flex min-h-screen">
        <StaffSideBar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <StaffTopBar onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-white p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}