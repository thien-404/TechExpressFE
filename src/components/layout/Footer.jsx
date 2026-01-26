import { useState } from 'react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      {/* ================= CAM KẾT ================= */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6 border-b">
        <CommitItem
          title="Giao hàng siêu tốc 2 - 4H"
          desc="Giao hàng trong nội thành HCM & Hà Nội nhanh chóng từ 2 - 4H."
        />
        <CommitItem
          title="7 ngày đổi trả"
          desc="Yên tâm mua sắm với chính sách đổi trả trong vòng 7 ngày."
        />
        <CommitItem
          title="100% chính hãng"
          desc="Cam kết chất lượng sản phẩm chính hãng 100%."
        />
        <CommitItem
          title="Thanh toán dễ dàng"
          desc="COD, chuyển khoản, quẹt thẻ, trả góp."
        />
      </div>

      {/* ================= DESKTOP FOOTER ================= */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-4 gap-8 text-sm text-slate-600">
          {/* Giới thiệu */}
          <FooterCol title="GIỚI THIỆU">
            <li>Giới thiệu TechExpress</li>
            <li>Hệ thống cửa hàng</li>
            <li>Điều khoản giao dịch</li>
            <li>Bảo mật thông tin</li>
            <li>Tuyển dụng</li>
          </FooterCol>

          {/* Chính sách */}
          <FooterCol title="CHÍNH SÁCH CÔNG TY">
            <li>Chính sách giao nhận</li>
            <li className="text-[#0090D0] font-medium">
              Chính sách đổi trả hàng
            </li>
            <li>Chính sách bảo hành</li>
            <li>Hướng dẫn thanh toán</li>
            <li>Hướng dẫn trả góp</li>
            <li>Hướng dẫn kiểm tra hành trình đơn hàng</li>
          </FooterCol>

          {/* Hỗ trợ */}
          <FooterCol title="HỖ TRỢ KHÁCH HÀNG">
            <li>Mua hàng: <strong>(028) 7301 3878</strong></li>
            <li>Bảo hành: <strong>(028) 7301 3879</strong></li>
            <li>Cổng thông tin hỗ trợ khách hàng</li>
            <li className="text-[#0090D0]">hotro.sieutoc.com</li>
            <li>Gửi yêu cầu hỗ trợ kỹ thuật</li>
            <li>Tra cứu thông tin hóa đơn</li>
            <li>Phản ánh chất lượng dịch vụ</li>
            <li className="pt-2"><strong>P. Kinh doanh:</strong></li>
            <li>sales@techexpress.com</li>
            <li><strong>Hợp tác thanh toán:</strong></li>
            <li>payment@techexpress.com</li>
          </FooterCol>

          {/* Showroom */}
          <Showroom />
        </div>
      </div>

      {/* ================= MOBILE FOOTER ================= */}
      <div className="lg:hidden px-4 py-6 space-y-4 text-sm text-slate-600">
        <Accordion title="GIỚI THIỆU">
          <li>Giới thiệu TechExpress</li>
          <li>Hệ thống cửa hàng</li>
          <li>Điều khoản giao dịch</li>
          <li>Bảo mật thông tin</li>
          <li>Tuyển dụng</li>
        </Accordion>

        <Accordion title="CHÍNH SÁCH CÔNG TY">
          <li>Chính sách giao nhận</li>
          <li>Chính sách đổi trả hàng</li>
          <li>Chính sách bảo hành</li>
          <li>Hướng dẫn thanh toán</li>
          <li>Hướng dẫn trả góp</li>
        </Accordion>

        <Accordion title="HỖ TRỢ KHÁCH HÀNG">
          <li>Mua hàng: <strong>(028) 7301 3878</strong></li>
          <li>Bảo hành: <strong>(028) 7301 3879</strong></li>
          <li>hotro.sieutoc.com</li>
          <li>sales@techexpress.com</li>
        </Accordion>

        {/* Showroom - giữ nguyên */}
        <Showroom />
      </div>

      {/* ================= COPYRIGHT ================= */}
      <div className="border-t py-3 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TechExpress. All rights reserved.
      </div>
    </footer>
  )
}

/* ================= SUB COMPONENT ================= */

function CommitItem({ title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-full bg-[#0090D0]/10 text-[#0090D0] flex items-center justify-center font-bold">
        ✓
      </div>
      <div>
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-sm text-slate-500">{desc}</div>
      </div>
    </div>
  )
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="font-semibold text-slate-800 mb-3">{title}</h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b pb-2 border-[#0090D0]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-semibold text-slate-800"
      >
        {title}
        <span className="text-lg">{open ? '−' : '+'}</span>
      </button>

      {open && <ul className="mt-2 space-y-2">{children}</ul>}
    </div>
  )
}

function Showroom() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-800 mb-2">
          TP. HCM – Showroom
        </h4>
        <p>22 Nguyễn Hoàng, P. Bình Trung, TP.HCM</p>
        <p>Điện thoại: (028) 7301 3878</p>
        <p>Mở cửa: 9h – 21h (T2 – CN)</p>
      </div>

      <div>
        <h4 className="font-semibold text-slate-800 mb-2">
          Hà Nội – Showroom
        </h4>
        <p>60 Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội</p>
        <p>Điện thoại: (028) 7301 3878</p>
        <p>Mở cửa: 9h – 21h (T2 – CN)</p>
      </div>

      <div>
        <h4 className="font-semibold text-slate-800">
          CÔNG TY TNHH TECH EXPRESS
        </h4>
        <p className="text-xs mt-1">
          MST: Duoc cap boi 6 chang trai
        </p>
      </div>
    </div>
  )
}
