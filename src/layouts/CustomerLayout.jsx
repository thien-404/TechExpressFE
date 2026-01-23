import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 bg-slate-50">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
