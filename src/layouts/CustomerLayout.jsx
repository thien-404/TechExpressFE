import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import CategorySidebar from '../components/ui/CategorySidebar'
import CartBootstrap from '../components/customer/CartBootstrap'
import ChatWidget from '../components/common/ChatWidget'
import useRouteScrollReset from '../hooks/useRouteScrollReset.js'

export default function CustomerLayout() {
  const location = useLocation()
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false)
  const isHomePage = location.pathname === '/'
  const isCategoriesPage = location.pathname === '/categories'
  const isProductPage =
    location.pathname === '/products' || location.pathname.startsWith('/products/')
  const showCategorySidebar =
    isHomePage || isCategoriesPage || isProductPage

  useRouteScrollReset()

  useEffect(() => {
    setIsCategorySidebarOpen(false)
  }, [location.pathname, location.search])

  const handleOpenCategorySidebar = () => setIsCategorySidebarOpen(true)
  const handleCloseCategorySidebar = () => setIsCategorySidebarOpen(false)

  return (
    <div className="flex flex-col min-h-screen">
      <CartBootstrap />

      {/* Header */}
      <Header
        onToggleCategorySidebar={handleOpenCategorySidebar}
        showCategorySidebarToggle={showCategorySidebar}
      />

      {/* Main content */}
      <main className="flex-1 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
          {showCategorySidebar ? (
            <CategorySidebar
              isMobileOpen={isCategorySidebarOpen}
              onCloseMobile={handleCloseCategorySidebar}
            />
          ) : null}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      <ChatWidget />
    </div>
  )
}
