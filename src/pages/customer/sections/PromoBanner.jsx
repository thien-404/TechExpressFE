import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Clock, Gift } from 'lucide-react'

export default function PromoBanner() {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main promo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-gradient-to-br from-[#0090D0] to-[#0077B0] rounded-2xl p-8 lg:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 text-sm font-bold px-4 py-2 rounded-full mb-4">
                <Zap size={16} />
                Flash Sale
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Giảm đến 50% PC Gaming
              </h2>
              <p className="text-white/80 mb-6 max-w-lg">
                Ưu đãi cực sốc cho dàn PC Gaming cao cấp. Số lượng có hạn,
                nhanh tay đặt hàng ngay!
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <NavLink
                  to="/products?category=gaming"
                  className="inline-flex items-center gap-2 bg-white text-[#0090D0] font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Mua Ngay
                </NavLink>

                {/* Countdown placeholder */}
                <div className="flex items-center gap-2 text-white">
                  <Clock size={20} />
                  <span className="font-mono text-lg">Kết thúc sớm</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side promo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-8 flex flex-col justify-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <Gift size={32} className="text-slate-900" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Quà Tặng Kèm
            </h3>
            <p className="text-slate-700 mb-4">
              Miễn phí chuột gaming khi mua PC trên 20 triệu
            </p>
            <NavLink
              to="/promotions"
              className="text-slate-900 font-semibold hover:underline"
            >
              Xem chi tiết →
            </NavLink>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
