import React, { useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminTopbar from '../components/ui/AdminTopBar.jsx'
import AdminSideBar from '../components/ui/AdminSideBar.jsx'
import useRouteScrollReset from '../hooks/useRouteScrollReset.js'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const contentRef = useRef(null)

  useRouteScrollReset({ targetRef: contentRef })

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen relative">
        {/* ================= SIDEBAR ================= */}
        <AdminSideBar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* ================= RIGHT CONTENT ================= */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <AdminTopbar
            onOpenSidebar={() => setSidebarOpen(true)}
          />

          {/* Page content */}
          <main ref={contentRef} className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
