import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import CartBootstrap from '../components/customer/CartBootstrap'

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <CartBootstrap />

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
