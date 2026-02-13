import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import CategorySidebar from '../components/ui/CategorySidebar'

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
          <CategorySidebar />
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
