export const DeliveryType = {
  Shipping: 0,
  PickUp: 1,
};

export const PaidType = {
  Full: 0,
  Installment: 1,
};

export const PAYMENT_OPTION = {
  QR: "QR",
  INSTALLMENT: "INSTALLMENT",
};

export const ONLINE_PAYMENT_METHOD = 1;
export const SHIPPING_FEE = 30000;
export const INSTALLMENT_OPTIONS = [6, 9, 12];
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^0\d{9,10}$/;
export const IDENTITY_REGEX = /^(\d{9}|\d{12})$/;

export const PICKUP_STORES = [
  {
    id: "store-q1",
    name: "TechExpress Quận 1",
    address: "12 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM",
    workingHours: "Thứ 2 - Thứ 7, 08:30 - 17:30",
  },
  {
    id: "store-tb",
    name: "TechExpress Tân Bình",
    address: "89 Cộng Hòa, Phường 4, Tân Bình, TP.HCM",
    workingHours: "Thứ 2 - Thứ 7, 08:30 - 17:30",
  },
  {
    id: "store-thuduc",
    name: "TechExpress Thủ Đức",
    address: "35 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP.HCM",
    workingHours: "Thứ 2 - Thứ 7, 08:30 - 17:30",
  },
];

export function createInitialCheckoutForm() {
  return {
    receiverFullName: "",
    receiverEmail: "",
    trackingPhone: "",
    shippingAddress: "",
    notes: "",
    receiverIdentityCard: "",
    installmentDurationMonth: 6,
    deliveryType: DeliveryType.Shipping,
    paymentOption: PAYMENT_OPTION.QR,
    pickupStoreId: "",
  };
}
