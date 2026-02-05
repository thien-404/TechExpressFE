import { motion } from 'framer-motion'
import SectionTitle from '../../../components/customer/SectionTitle'
import ProductCard from '../../../components/customer/ProductCard'

export default function BestSellers({ products = [], loading = false }) {
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <SectionTitle
          title="Bán Chạy Nhất"
          subtitle="Những sản phẩm được khách hàng yêu thích nhất"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="aspect-square bg-slate-200 rounded-lg mb-4" />
              <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <SectionTitle
        title="Bán Chạy Nhất"
        subtitle="Những sản phẩm được khách hàng yêu thích nhất"
        action={{ label: 'Xem thêm', to: '/products?sort=bestseller' }}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mt-8">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard product={product} showRank={index + 1} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
