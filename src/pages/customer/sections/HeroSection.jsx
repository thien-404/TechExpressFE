import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Cpu, Monitor, Headphones, Gamepad2 } from 'lucide-react'

export default function HeroSection() {
  const features = [
    { icon: Cpu, label: 'Linh kiện PC', color: 'bg-blue-500' },
    { icon: Monitor, label: 'Màn hình', color: 'bg-purple-500' },
    { icon: Gamepad2, label: 'Gaming Gear', color: 'bg-red-500' },
    { icon: Headphones, label: 'Phụ kiện', color: 'bg-green-500' }
  ]

  return (
    <section className="relative bg-gradient-to-br from-[#0090D0] via-[#0077B0] to-[#005580] overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border-2 border-white rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-white rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block bg-yellow-400 text-slate-900 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Khuyến mãi Hot
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
              Công Nghệ
              <span className="text-yellow-400"> Đỉnh Cao</span>
              <br />Giá Cả Tốt Nhất
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-lg">
              Khám phá bộ sưu tập PC Gaming, Laptop, Linh kiện máy tính và phụ kiện
              công nghệ hàng đầu với giá ưu đãi nhất thị trường.
            </p>

            <div className="flex flex-wrap gap-4">
              <NavLink
                to="/products"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                Mua Ngay
                <ArrowRight size={20} />
              </NavLink>
              <NavLink
                to="/categories"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg border border-white/30 transition-colors"
              >
                Xem Danh Mục
              </NavLink>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 pt-10 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold text-yellow-400">1000+</div>
                <div className="text-sm text-white/70">Sản phẩm</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">50K+</div>
                <div className="text-sm text-white/70">Khách hàng</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">100%</div>
                <div className="text-sm text-white/70">Chính hãng</div>
              </div>
            </div>
          </motion.div>

          {/* Right - Feature icons grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-6"
          >
            {features.map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 ${item.color} rounded-2xl mb-4`}>
                  <item.icon size={32} className="text-white" />
                </div>
                <div className="text-white font-semibold">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
