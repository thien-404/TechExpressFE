import { useQuery } from '@tanstack/react-query'
import { apiService } from '../../config/axios'

// Sections
import HeroSection from './sections/HeroSection'
import FeaturedCategories from './sections/FeaturedCategories'
import NewArrivals from './sections/NewArrivals'
import PromoBanner from './sections/PromoBanner'
import BestSellers from './sections/BestSellers'
import WhyChooseUs from './sections/WhyChooseUs'

export default function HomePage() {
  // Fetch categories
  const {
    data: categories = [],
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['categories-home'],
    queryFn: async () => {
      const res = await apiService.get('/category/parent')
      if (res?.statusCode === 200) {
        return res.value || []
      }
      return []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch new products (sorted by creation date)
  const {
    data: newProducts = [],
    isLoading: newProductsLoading
  } = useQuery({
    queryKey: ['products-new'],
    queryFn: async () => {
      const res = await apiService.get('/product/ui-latest', {
        Number: 8
      })
      if (res?.statusCode === 200) {
        return res.value || []
      }
      return []
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  })

  // Fetch best sellers (using price desc as placeholder - ideally would sort by sales)
  const {
    data: bestSellers = [],
    isLoading: bestSellersLoading
  } = useQuery({
    queryKey: ['products-bestsellers'],
    queryFn: async () => {
      const res = await apiService.get('/product/top-selling', {
        Page: 1,
        PageSize: 8,
        Status: 0, // Available
        SortBy: 0, // Price
        SortDirection: 1, // Descending
        count: 8
      })
      if (res?.statusCode === 200) {
        return res.value?.items || []
      }
      return []
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  })

  return (
    <div className="bg-slate-50 min-h-screen">
      <HeroSection />

      <FeaturedCategories
        categories={categories}
        loading={categoriesLoading}
      />

      <NewArrivals
        products={newProducts}
        loading={newProductsLoading}
      />

      <PromoBanner />

      {/*Tạm để new product để UI hiển thị */}
      <BestSellers
        products={newProducts}
        loading={newProductsLoading}
      />

      <WhyChooseUs />
    </div>
  )
}
