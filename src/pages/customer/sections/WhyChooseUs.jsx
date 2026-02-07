import { motion } from 'framer-motion'
import { Truck, Shield, CreditCard, Headphones } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Giao Hàng Nhanh',
    description: 'Giao hàng nội thành HCM & Hà Nội trong 2-4 giờ',
    color: 'bg-blue-500'
  },
  {
    icon: Shield,
    title: '100% Chính Hãng',
    description: 'Cam kết sản phẩm chính hãng, bảo hành đầy đủ',
    color: 'bg-green-500'
  },
  {
    icon: CreditCard,
    title: 'Thanh Toán Linh Hoạt',
    description: 'COD, chuyển khoản, thẻ tín dụng, trả góp 0%',
    color: 'bg-purple-500'
  },
  {
    icon: Headphones,
    title: 'Hỗ Trợ 24/7',
    description: 'Đội ngũ tư vấn viên sẵn sàng hỗ trợ bạn',
    color: 'bg-orange-500'
  }
]

export default function WhyChooseUs() {
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
            Tại Sao Chọn TechExpress?
          </h2>
          <p className="text-slate-500">
            Cam kết mang đến trải nghiệm mua sắm tốt nhất cho bạn
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} rounded-2xl mb-4`}>
                <feature.icon size={28} className="text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
