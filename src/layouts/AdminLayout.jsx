import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminTopbar from '../components/ui/AdminTopBar.jsx'
import AdminSideBar from '../components/ui/AdminSideBar.jsx'


export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        {/* Left sidebar */}
        <AdminSideBar />

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <AdminTopbar />

          {/* Page content */}
          <main className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="mx-auto max-w-6xl ">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
