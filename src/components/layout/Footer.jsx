import { useState } from "react";

const SHOWROOMS = [
  {
    name: "TP. HCM - Showroom",
    address: "22 Nguyễn Hoàng, P. Bình Trung, TP.HCM",
    phone: "(028) 7301 3878",
    hours: "9h - 21h (T2 - CN)",
    mapQuery: "22 Nguyễn Hoàng, P. Bình Trung, TP.HCM",
  },
  {
    name: "Hà Nội - Showroom",
    address: "60 Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội",
    phone: "(028) 7301 3878",
    hours: "9h - 21h (T2 - CN)",
    mapQuery: "60 Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội",
  },
];

const FOOTER_GROUPS = {
  about: {
    title: "GIỚI THIỆU",
    items: [
      "Giới thiệu TechExpress",
      "Hệ thống cửa hàng",
      "Điều khoản giao dịch",
      "Bảo mật thông tin",
      "Tuyển dụng",
    ],
  },
  policy: {
    title: "CHÍNH SÁCH CÔNG TY",
    items: [
      "Chính sách giao nhận",
      "Chính sách đổi trả hàng",
      "Chính sách bảo hành",
      "Hướng dẫn thanh toán",
      "Hướng dẫn trả góp",
      "Hướng dẫn kiểm tra hành trình đơn hàng",
    ],
  },
  support: {
    title: "HỖ TRỢ KHÁCH HÀNG",
    items: [
      "Mua hàng: (028) 7301 3878",
      "Bảo hành: (028) 7301 3879",
      "Cổng thông tin hỗ trợ khách hàng",
      "hotro.sieutoc.com",
      "Gửi yêu cầu hỗ trợ kỹ thuật",
      "Tra cứu thông tin hóa đơn",
      "Phản ánh chất lượng dịch vụ",
    ],
    businessLabel: "P. Kinh doanh:",
    businessEmail: "sales@techexpress.com",
    paymentLabel: "Hợp tác thanh toán:",
    paymentEmail: "payment@techexpress.com",
  },
};

const COMMITMENTS = [
  {
    title: "Giao hàng siêu tốc 2 - 4H",
    desc: "Giao hàng trong nội thành HCM và Hà Nội nhanh chóng từ 2 - 4H.",
  },
  {
    title: "7 ngày đổi trả",
    desc: "Yên tâm mua sắm với chính sách đổi trả trong vòng 7 ngày.",
  },
  {
    title: "100% chính hãng",
    desc: "Cam kết chất lượng sản phẩm chính hãng 100%.",
  },
  {
    title: "Thanh toán dễ dàng",
    desc: "COD, chuyển khoản, quẹt thẻ, trả góp.",
  },
];

function getMapEmbedUrl(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

function getMapLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 border-b px-4 py-6 md:grid-cols-4">
        {COMMITMENTS.map((item) => (
          <CommitItem key={item.title} title={item.title} desc={item.desc} />
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-4 py-10 text-sm text-slate-600">
          <FooterCol title={FOOTER_GROUPS.about.title}>
            {FOOTER_GROUPS.about.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </FooterCol>

          <FooterCol title={FOOTER_GROUPS.policy.title}>
            {FOOTER_GROUPS.policy.items.map((item) => (
              <li
                key={item}
                className={
                  item === "Chính sách đổi trả hàng"
                    ? "font-medium text-[#0090D0]"
                    : undefined
                }
              >
                {item}
              </li>
            ))}
          </FooterCol>

          <FooterCol title={FOOTER_GROUPS.support.title}>
            {FOOTER_GROUPS.support.items.map((item) => (
              <li
                key={item}
                className={item === "hotro.sieutoc.com" ? "text-[#0090D0]" : undefined}
              >
                {item.includes(": (") ? (
                  <>
                    {item.split(": ")[0]}: <strong>{item.split(": ")[1]}</strong>
                  </>
                ) : (
                  item
                )}
              </li>
            ))}
            <li className="pt-2">
              <strong>{FOOTER_GROUPS.support.businessLabel}</strong>
            </li>
            <li>{FOOTER_GROUPS.support.businessEmail}</li>
            <li>
              <strong>{FOOTER_GROUPS.support.paymentLabel}</strong>
            </li>
            <li>{FOOTER_GROUPS.support.paymentEmail}</li>
          </FooterCol>

          <Showroom />
        </div>
      </div>

      <div className="space-y-4 px-4 py-6 text-sm text-slate-600 lg:hidden">
        <Accordion title={FOOTER_GROUPS.about.title}>
          {FOOTER_GROUPS.about.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Accordion>

        <Accordion title={FOOTER_GROUPS.policy.title}>
          {FOOTER_GROUPS.policy.items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Accordion>

        <Accordion title={FOOTER_GROUPS.support.title}>
          <li>
            Mua hàng: <strong>(028) 7301 3878</strong>
          </li>
          <li>
            Bảo hành: <strong>(028) 7301 3879</strong>
          </li>
          <li>hotro.sieutoc.com</li>
          <li>sales@techexpress.com</li>
        </Accordion>

        <Showroom />
      </div>

      <div className="border-t py-3 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TechExpress. All rights reserved.
      </div>
    </footer>
  );
}

function CommitItem({ title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0090D0]/10 font-bold text-[#0090D0]">
        ✓
      </div>
      <div>
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-sm text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="mb-3 font-semibold text-slate-800">{title}</h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#0090D0] pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between font-semibold text-slate-800"
      >
        {title}
        <span className="text-lg">{open ? "-" : "+"}</span>
      </button>

      {open && <ul className="mt-2 space-y-2">{children}</ul>}
    </div>
  );
}

function Showroom() {
  const [activeShowroom, setActiveShowroom] = useState(SHOWROOMS[0].name);
  const showroom = SHOWROOMS.find((item) => item.name === activeShowroom) ?? SHOWROOMS[0];
  const mapEmbedUrl = getMapEmbedUrl(showroom.mapQuery);
  const mapLink = getMapLink(showroom.mapQuery);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SHOWROOMS.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveShowroom(item.name)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                item.name === showroom.name
                  ? "border-[#0090D0] bg-[#0090D0] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-[#0090D0] hover:text-[#0090D0]"
              }`}
              aria-pressed={item.name === showroom.name}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="space-y-2 p-4">
            <h4 className="font-semibold text-slate-800">{showroom.name}</h4>
            <p>{showroom.address}</p>
            <p>
              Điện thoại: <strong>{showroom.phone}</strong>
            </p>
            <p>Mở cửa: {showroom.hours}</p>
          </div>

          <div className="border-y border-slate-200 bg-white">
            <iframe
              title={`Google Maps - ${showroom.name}`}
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-52 w-full md:h-56"
            />
          </div>

          <div className="p-4">
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[#0090D0] transition hover:text-[#0073a6]"
            >
              Xem trên Google Maps
            </a>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-800">CÔNG TY TNHH TECH EXPRESS</h4>
        <p className="mt-1 text-xs">MST: Được cấp bởi 6 chàng trai</p>
      </div>
    </div>
  );
}
