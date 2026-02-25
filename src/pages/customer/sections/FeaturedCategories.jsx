import { NavLink } from 'react-router-dom'
import SectionTitle from '../../../components/customer/SectionTitle'

export default function FeaturedCategories({ categories = [], loading = false }) {
  // Filter only parent categories (no parentCategoryId)
  const parentCategories = categories.filter(cat => !cat.parentCategoryId).slice(0, 6)

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <SectionTitle
          title="Danh Mục Nổi Bật"
          subtitle="Khám phá các danh mục sản phẩm công nghệ"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 text-center animate-pulse">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full" />
              <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (parentCategories.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <SectionTitle
        title="Danh Mục Nổi Bật"
        subtitle="Khám phá các danh mục sản phẩm công nghệ"
        action={{ label: 'Xem tất cả', to: '/categories' }}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
        {parentCategories.map((category) => (
          <div key={category.id}>
            <NavLink
              to={`/products?category=${category.id}`}
              className="group block bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg border border-slate-100 hover:border-[#0090D0] transition-all"
            >
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-16 h-16 mx-auto mb-4 object-contain"
                />
              ) : (
                <div className="w-16 h-16 mx-auto mb-4 bg-[#0090D0]/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#0090D0]">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
              <h3 className="font-semibold text-slate-800 group-hover:text-[#0090D0] transition-colors text-sm">
                {category.name}
              </h3>
            </NavLink>
          </div>
        ))}
      </div>
    </section>
  )
}
