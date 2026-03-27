import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Gift, TicketPercent } from "lucide-react";
import { toast } from "sonner";

import { apiService } from "../../config/axios";
import { useAuth } from "../../store/authContext";
import { orderService } from "../../services/orderService";
import { promotionService } from "../../services/promotionService";
import {
  fetchCartItems,
  removeCheckedOutLocalItems,
  selectCartCanCheckout,
  selectCartItems,
  selectCartSelectedItems,
  selectCartSelectedSubtotal,
} from "../../store/slices/cartSlice";

const DeliveryType = {
  Shipping: 0,
  PickUp: 1,
};

const PaidType = {
  Full: 0,
  Installment: 1,
};

const PAYMENT_OPTION = {
  QR: "QR",
  COD: "COD",
  INSTALLMENT: "INSTALLMENT",
};

const ONLINE_PAYMENT_METHOD = 1;
const SHIPPING_FEE = 30000;
const INSTALLMENT_OPTIONS = [6, 9, 12];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{9,10}$/;
const IDENTITY_REGEX = /^(\d{9}|\d{12})$/;

const PICKUP_STORES = [
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

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

function normalizePhone(value) {
  return (value || "").replace(/\s+/g, "").trim();
}

function getCombinedName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
}

function getCombinedAddress(user) {
  return [user?.address, user?.ward, user?.province]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function isItemInvalid(item) {
  const outOfStatus = item?.productStatus && item.productStatus !== "Available";
  const outOfStock = item?.availableStock !== null && item?.availableStock <= 0;
  const overStock =
    item?.availableStock !== null && item?.quantity > item.availableStock;

  return outOfStatus || outOfStock || overStock;
}

function buildPickupAddress(store) {
  if (!store) return "";
  return `${store.name} - ${store.address}`.trim();
}

function buildSelectedItemsSignature(items) {
  return JSON.stringify(
    items.map((item) => ({
      key: item.key,
      productId: item.productId,
      quantity: item.quantity,
    })),
  );
}

function buildGiftGroups(promotionResult) {
  const promotionLines = promotionResult?.appliedPromotions || [];

  return promotionLines
    .map((line) => {
      const freeItems = Array.isArray(line?.freeItems) ? line.freeItems : [];
      if (freeItems.length === 0) {
        return null;
      }

      const mergedItems = freeItems.reduce((map, item) => {
        const productId = item?.productId;
        if (!productId) return map;

        const current = map.get(productId) || {
          productId,
          quantity: 0,
        };

        current.quantity += Math.max(Number(item?.quantity) || 0, 0);
        map.set(productId, current);
        return map;
      }, new Map());

      const uniqueItems = Array.from(mergedItems.values());
      const rawPickCount = Number(line?.freeItemPickCount);
      const requiredPickCount =
        Number.isFinite(rawPickCount) && rawPickCount > 0
          ? Math.min(rawPickCount, uniqueItems.length)
          : 0;

      return {
        promotionId: line?.promotionId,
        promotionName: line?.promotionName || "Khuyến mãi quà tặng",
        promotionCode: line?.promotionCode || "",
        items: uniqueItems,
        requiredPickCount,
        isSelectable: requiredPickCount > 0,
      };
    })
    .filter(Boolean);
}

function validateForm(form, { isInstallment }) {
  const errors = {};
  const normalizedPhone = normalizePhone(form.trackingPhone);
  const trimmedEmail = form.receiverEmail.trim();

  if (!form.receiverFullName.trim()) {
    errors.receiverFullName = "Vui lòng nhập họ tên người nhận.";
  }

  if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
    errors.receiverEmail = "Email không hợp lệ.";
  }

  if (!normalizedPhone) {
    errors.trackingPhone = "Vui lòng nhập số điện thoại.";
  } else if (!PHONE_REGEX.test(normalizedPhone)) {
    errors.trackingPhone = "Số điện thoại không hợp lệ.";
  }

  if (form.deliveryType === DeliveryType.Shipping && !form.shippingAddress.trim()) {
    errors.shippingAddress = "Vui lòng nhập địa chỉ giao hàng.";
  }

  if (form.deliveryType === DeliveryType.PickUp && !form.pickupStoreId) {
    errors.pickupStoreId = "Vui lòng chọn cửa hàng nhận hàng.";
  }

  if (isInstallment) {
    if (!form.receiverIdentityCard.trim()) {
      errors.receiverIdentityCard = "Vui lòng nhập CCCD/CMND.";
    } else if (!IDENTITY_REGEX.test(form.receiverIdentityCard.trim())) {
      errors.receiverIdentityCard = "CCCD/CMND phải gồm 9 hoặc 12 chữ số.";
    }

    if (!INSTALLMENT_OPTIONS.includes(Number(form.installmentDurationMonth))) {
      errors.installmentDurationMonth = "Vui lòng chọn kỳ hạn trả góp.";
    }
  }

  return errors;
}

function InputField({
  label,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  disabled = false,
  helperText = "",
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0] disabled:cursor-not-allowed disabled:bg-slate-100"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {!error && helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  const cartItems = useSelector(selectCartItems);
  const selectedItems = useSelector(selectCartSelectedItems);
  const selectedSubtotal = useSelector(selectCartSelectedSubtotal);
  const canCheckout = useSelector(selectCartCanCheckout);

  const didPrefillRef = useRef(false);
  const lastPromotionContextRef = useRef("");
  const promotionRequestSequenceRef = useRef(0);

  const isPaymentReturn = searchParams.get("paymentReturn") === "1";
  const orderCode = searchParams.get("orderCode") || "";
  const paymentLinkId = searchParams.get("id") || "";
  const paymentStatus = searchParams.get("status") || "";
  const isCanceled = searchParams.get("cancel") === "true";
  const useBackendReturnCancel =
    import.meta.env.VITE_USE_BACKEND_RETURN_CANCEL !== "0";

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentReturnState, setPaymentReturnState] = useState({
    handling: false,
    handled: false,
    ok: null,
    message: "",
  });
  const [form, setForm] = useState({
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
  });
  const [promotionCode, setPromotionCode] = useState("");
  const [lastAppliedPromotionCode, setLastAppliedPromotionCode] = useState("");
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState("");
  const [promotionResult, setPromotionResult] = useState(null);
  const [selectedFreeItemsByPromotionId, setSelectedFreeItemsByPromotionId] =
    useState({});

  const { data: userMe } = useQuery({
    enabled: isAuthenticated,
    queryKey: ["checkout-user-me"],
    queryFn: async () => {
      const res = await apiService.get("/user/me");
      if (res?.statusCode !== 200) {
        throw new Error(res?.message || "Không thể lấy thông tin người dùng.");
      }
      return res.value;
    },
  });

  useEffect(() => {
    if (!isPaymentReturn) return;
    if (!orderCode && !paymentLinkId) return;

    const isSuccessStatus = paymentStatus === "PAID" && !isCanceled;

    const handleWithoutBackend = () => {
      setPaymentReturnState({
        handling: false,
        handled: true,
        ok: isSuccessStatus,
        message: isSuccessStatus
          ? "Thanh toán thành công. Đơn hàng của bạn đang được xử lý."
          : "Thanh toán thất bại hoặc đã bị hủy. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.",
      });
    };

    const run = async () => {
      setPaymentReturnState({
        handling: true,
        handled: false,
        ok: null,
        message: "Đang xác nhận thanh toán...",
      });

      if (!useBackendReturnCancel) {
        handleWithoutBackend();
        return;
      }

      try {
        const targetOrderCode = orderCode || paymentLinkId;
        const endpoint = isSuccessStatus
          ? "/payments/payos/return"
          : "/payments/payos/cancel";

        const response = await apiService.get(endpoint, {
          orderCode: targetOrderCode,
        });

        const data = response?.data ?? response;
        const ok = !!data?.value?.ok;
        const message =
          data?.message ||
          (ok
            ? "Thanh toán thành công. Đơn hàng của bạn đang được xử lý."
            : "Thanh toán thất bại hoặc đã bị hủy. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.");

        setPaymentReturnState({
          handling: false,
          handled: true,
          ok,
          message,
        });
      } catch (error) {
        setPaymentReturnState({
          handling: false,
          handled: true,
          ok: false,
          message:
            error?.message ||
            "Không thể xác nhận trạng thái thanh toán. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.",
        });
      }
    };

    run();
  }, [
    isPaymentReturn,
    orderCode,
    paymentLinkId,
    paymentStatus,
    isCanceled,
    useBackendReturnCancel,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      didPrefillRef.current = false;
      return;
    }

    if (!userMe || didPrefillRef.current) return;

    didPrefillRef.current = true;
    setForm((prev) => ({
      ...prev,
      receiverFullName: getCombinedName(userMe) || prev.receiverFullName,
      receiverEmail: userMe?.email || prev.receiverEmail,
      trackingPhone: userMe?.phone || prev.trackingPhone,
      shippingAddress: getCombinedAddress(userMe) || prev.shippingAddress,
    }));
  }, [isAuthenticated, userMe]);

  const lockedTrackingPhone = useMemo(
    () => normalizePhone(userMe?.phone),
    [userMe?.phone],
  );
  const isTrackingPhoneLocked =
    isAuthenticated && Boolean(lockedTrackingPhone);

  useEffect(() => {
    if (!isTrackingPhoneLocked) return;
    setForm((prev) => {
      if (normalizePhone(prev.trackingPhone) === lockedTrackingPhone) {
        return prev;
      }
      return {
        ...prev,
        trackingPhone: lockedTrackingPhone,
      };
    });
  }, [isTrackingPhoneLocked, lockedTrackingPhone]);

  useEffect(() => {
    if (isPaymentReturn) return;
    if (cartItems.length === 0) return;
    if (selectedItems.length > 0) return;
    navigate("/cart", { replace: true });
  }, [cartItems.length, isPaymentReturn, navigate, selectedItems.length]);

  const selectedInvalidItems = useMemo(
    () => selectedItems.filter(isItemInvalid),
    [selectedItems],
  );
  const isInstallment = form.paymentOption === PAYMENT_OPTION.INSTALLMENT;
  const selectedStore = useMemo(
    () => PICKUP_STORES.find((store) => store.id === form.pickupStoreId) || null,
    [form.pickupStoreId],
  );

  const selectedItemsSignature = useMemo(
    () => buildSelectedItemsSignature(selectedItems),
    [selectedItems],
  );

  const promotionGroups = useMemo(
    () => buildGiftGroups(promotionResult),
    [promotionResult],
  );

  useEffect(() => {
    setSelectedFreeItemsByPromotionId((prev) => {
      const next = {};

      promotionGroups.forEach((group) => {
        if (!group.isSelectable) return;

        const availableIds = new Set(group.items.map((item) => item.productId));
        next[group.promotionId] = (prev[group.promotionId] || [])
          .filter((productId) => availableIds.has(productId))
          .slice(0, group.requiredPickCount);
      });

      return next;
    });
  }, [promotionGroups]);

  const allGiftProductIds = useMemo(() => {
    const ids = new Set();

    promotionGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.productId) {
          ids.add(item.productId);
        }
      });
    });

    return Array.from(ids).sort();
  }, [promotionGroups]);

  const { data: giftProductMap = {} } = useQuery({
    enabled: allGiftProductIds.length > 0,
    queryKey: ["checkout-gift-products", allGiftProductIds],
    queryFn: async () => {
      const entries = await Promise.all(
        allGiftProductIds.map(async (productId) => {
          const res = await apiService.get(`/product/${productId}`);
          if (res?.statusCode === 200 && res.value) {
            return [productId, res.value];
          }
          return [productId, null];
        }),
      );

      return Object.fromEntries(entries);
    },
    staleTime: 60000,
  });

  const normalizedPromotionCode = promotionCode.trim().toUpperCase();
  const normalizedTrackingPhone = normalizePhone(form.trackingPhone);
  const activePromotionCode = lastAppliedPromotionCode.trim().toUpperCase();
  const promotionContextKey = `${activePromotionCode}|${selectedItemsSignature}|${normalizedTrackingPhone}`;
  const canCalculatePromotion =
    selectedItems.length > 0 && PHONE_REGEX.test(normalizedTrackingPhone);
  const hasPromotionState =
    Boolean(promotionResult) ||
    Boolean(promotionError) ||
    Object.keys(selectedFreeItemsByPromotionId).length > 0;

  const clearPromotionState = useCallback(
    ({
      preserveCode = true,
      preserveAppliedCode = false,
      errorMessage = "",
      contextKey = "",
      invalidateRequest = false,
    } = {}) => {
      if (invalidateRequest) {
        promotionRequestSequenceRef.current += 1;
        setPromotionLoading(false);
      }

      setPromotionResult(null);
      setSelectedFreeItemsByPromotionId({});
      setPromotionError(errorMessage);
      setLastAppliedPromotionCode((prev) =>
        preserveAppliedCode ? prev : "",
      );
      lastPromotionContextRef.current = contextKey;

      if (!preserveCode) {
        setPromotionCode("");
      }
    },
    [],
  );

  const calculatePromotion = useCallback(
    async ({ code, mode = "manual" } = {}) => {
      const isManual = mode === "manual";
      const nextCode = (code || "").trim().toUpperCase();
      const nextPhone = normalizePhone(form.trackingPhone);
      const nextContextKey = `${nextCode}|${selectedItemsSignature}|${nextPhone}`;
      const autoContextKey = `|${selectedItemsSignature}|${nextPhone}`;
      const requestId = promotionRequestSequenceRef.current + 1;
      promotionRequestSequenceRef.current = requestId;

      if (isManual && !nextCode) {
        const message = "Vui lòng nhập mã khuyến mãi.";
        clearPromotionState({
          preserveCode: true,
          errorMessage: message,
          contextKey: autoContextKey,
        });
        toast.error(message);
        return null;
      }

      if (!PHONE_REGEX.test(nextPhone)) {
        if (isManual) {
          const message =
            "Vui lòng nhập số điện thoại hợp lệ để kiểm tra khuyến mãi.";
          clearPromotionState({
            preserveCode: true,
            errorMessage: message,
          });
          toast.error(message);
        } else {
          clearPromotionState({
            preserveCode: true,
            preserveAppliedCode: Boolean(nextCode),
            contextKey: "",
          });
        }
        return null;
      }

      if (selectedItems.length === 0) {
        if (isManual) {
          const message =
            "Không có sản phẩm nào được chọn để áp dụng khuyến mãi.";
          clearPromotionState({
            preserveCode: true,
            errorMessage: message,
          });
          toast.error(message);
        } else {
          clearPromotionState({
            preserveCode: true,
            preserveAppliedCode: Boolean(nextCode),
            contextKey: "",
          });
        }
        return null;
      }

      setPromotionLoading(true);
      setPromotionError("");

      try {
        const response = await promotionService.calculatePromotion({
          codes: nextCode ? [nextCode] : [],
          checkoutItems: selectedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          phone: nextPhone,
        });

        if (requestId !== promotionRequestSequenceRef.current) {
          return null;
        }

        if (!response.succeeded) {
          throw new Error(response.message || "Không thể tính khuyến mãi.");
        }

        const result = response.value || {
          appliedPromotions: [],
          totalDiscountAmount: 0,
          totalFreeItems: [],
          unappliedCodeMessages: [],
        };

        setPromotionResult(result);
        setLastAppliedPromotionCode(nextCode);
        if (isManual) {
          setPromotionCode(nextCode);
        }
        setPromotionError("");
        lastPromotionContextRef.current = nextContextKey;

        if (isManual) {
          if ((result.appliedPromotions || []).length > 0) {
            toast.success("Đã áp dụng mã khuyến mãi.");
          } else if ((result.unappliedCodeMessages || []).length > 0) {
            toast.warning(result.unappliedCodeMessages[0]);
          } else {
            toast.info("Đã kiểm tra mã khuyến mãi.");
          }
        }

        return result;
      } catch (error) {
        if (requestId !== promotionRequestSequenceRef.current) {
          return null;
        }

        const message = error?.message || "Không thể tính khuyến mãi.";
        if (isManual) {
          clearPromotionState({
            preserveCode: true,
            errorMessage: message,
            contextKey: autoContextKey,
          });
          toast.error(message);
        } else {
          clearPromotionState({
            preserveCode: true,
            preserveAppliedCode: Boolean(nextCode),
            contextKey: nextContextKey,
          });
        }
        return null;
      } finally {
        if (requestId === promotionRequestSequenceRef.current) {
          setPromotionLoading(false);
        }
      }
    },
    [
      clearPromotionState,
      form.trackingPhone,
      selectedItems,
      selectedItemsSignature,
    ],
  );

  useEffect(() => {
    if (!canCalculatePromotion) {
      if (hasPromotionState) {
        clearPromotionState({
          preserveCode: true,
          preserveAppliedCode: Boolean(activePromotionCode),
          invalidateRequest: true,
        });
      } else {
        lastPromotionContextRef.current = "";
      }
      return;
    }

    if (promotionContextKey === lastPromotionContextRef.current) return;

    void calculatePromotion({
      code: activePromotionCode,
      mode: "auto",
    });
  }, [
    activePromotionCode,
    canCalculatePromotion,
    calculatePromotion,
    clearPromotionState,
    hasPromotionState,
    promotionContextKey,
  ]);

  const totalDiscountAmount = Math.max(
    Number(promotionResult?.totalDiscountAmount) || 0,
    0,
  );
  const taxableAmount = Math.max(0, selectedSubtotal - totalDiscountAmount);
  const shippingFee =
    form.deliveryType === DeliveryType.PickUp ? 0 : SHIPPING_FEE;
  const tax = Math.round(taxableAmount * 0.1);
  const total = Math.max(0, selectedSubtotal + shippingFee + tax - totalDiscountAmount);

  const chosenFreeProductIds = useMemo(() => {
    const ids = new Set();

    promotionGroups.forEach((group) => {
      if (!group.isSelectable) {
        group.items.forEach((item) => ids.add(item.productId));
        return;
      }

      (selectedFreeItemsByPromotionId[group.promotionId] || []).forEach((productId) =>
        ids.add(productId),
      );
    });

    return Array.from(ids);
  }, [promotionGroups, selectedFreeItemsByPromotionId]);
  const appliedPromotions = promotionResult?.appliedPromotions || [];
  const unappliedPromotionMessages = promotionResult?.unappliedCodeMessages || [];
  const hasPromotionDetails =
    appliedPromotions.length > 0 ||
    unappliedPromotionMessages.length > 0 ||
    promotionGroups.length > 0;
  const hasPromotionSummary =
    hasPromotionDetails ||
    totalDiscountAmount > 0 ||
    chosenFreeProductIds.length > 0;

  const incompleteFreeItemSelection = useMemo(
    () =>
      promotionGroups.some((group) => {
        if (!group.isSelectable) return false;
        return (
          (selectedFreeItemsByPromotionId[group.promotionId] || []).length !==
          group.requiredPickCount
        );
      }),
    [promotionGroups, selectedFreeItemsByPromotionId],
  );

  const disableSubmit =
    submitting ||
    authLoading ||
    !canCheckout ||
    selectedItems.length === 0 ||
    selectedInvalidItems.length > 0 ||
    incompleteFreeItemSelection;

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: "" };
    });
  };

  const handlePromotionCodeChange = (value) => {
    const nextValue = value.toUpperCase();
    setPromotionCode(nextValue);

    if (nextValue.trim().toUpperCase() !== activePromotionCode) {
      clearPromotionState({
        preserveCode: true,
        invalidateRequest: true,
      });
    }
  };

  const handlePaymentChange = (nextOption) => {
    if (nextOption === PAYMENT_OPTION.INSTALLMENT) {
      setField("paymentOption", nextOption);
      return;
    }

    setForm((prev) => ({
      ...prev,
      paymentOption: nextOption,
      receiverIdentityCard: "",
      installmentDurationMonth: 6,
    }));

    setErrors((prev) => ({
      ...prev,
      receiverIdentityCard: "",
      installmentDurationMonth: "",
    }));
  };

  const handleDeliveryChange = (nextType) => {
    setForm((prev) => ({
      ...prev,
      deliveryType: nextType,
      pickupStoreId: nextType === DeliveryType.Shipping ? "" : prev.pickupStoreId,
      paymentOption:
        nextType === DeliveryType.Shipping && prev.paymentOption === PAYMENT_OPTION.COD
          ? PAYMENT_OPTION.QR
          : prev.paymentOption,
    }));

    setErrors((prev) => ({
      ...prev,
      shippingAddress: "",
      pickupStoreId: "",
    }));
  };

  const toggleFreeItem = (group, productId) => {
    if (!group.isSelectable) return;

    setSelectedFreeItemsByPromotionId((prev) => {
      const current = prev[group.promotionId] || [];
      const exists = current.includes(productId);

      if (exists) {
        return {
          ...prev,
          [group.promotionId]: current.filter((id) => id !== productId),
        };
      }

      if (current.length >= group.requiredPickCount) {
        toast.warning(
          `Bạn chỉ được chọn ${group.requiredPickCount} sản phẩm quà tặng cho khuyến mãi này.`,
        );
        return prev;
      }

      return {
        ...prev,
        [group.promotionId]: [...current, productId],
      };
    });
  };

  const handleGoLogin = () => {
    navigate("/login?redirect=/checkout");
  };

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    setErrors({});
    setForm({
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
    });
    clearPromotionState({ preserveCode: false, invalidateRequest: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disableSubmit) return;

    if (selectedItems.length === 0) {
      toast.error("Không có sản phẩm nào được chọn để thanh toán.");
      navigate("/cart");
      return;
    }

    if (selectedInvalidItems.length > 0) {
      toast.error("Có sản phẩm không hợp lệ trong danh sách thanh toán.");
      return;
    }

    if (isAuthenticated && selectedItems.some((item) => !item.serverItemId)) {
      toast.error("Giỏ hàng chưa đồng bộ với máy chủ. Vui lòng thử lại.");
      return;
    }

    if (normalizedPromotionCode && normalizedPromotionCode !== lastAppliedPromotionCode) {
      toast.error("Vui lòng áp dụng lại mã khuyến mãi trước khi đặt hàng.");
      return;
    }

    if (isTrackingPhoneLocked && normalizedTrackingPhone !== lockedTrackingPhone) {
      toast.error("Số điện thoại phải trùng với số đã lưu trong tài khoản.");
      return;
    }

    if (incompleteFreeItemSelection) {
      toast.error("Vui lòng chọn đủ quà tặng trước khi đặt hàng.");
      return;
    }

    const nextErrors = validateForm(form, { isInstallment });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Vui lòng kiểm tra lại thông tin thanh toán.");
      return;
    }

    const shippingAddress =
      form.deliveryType === DeliveryType.PickUp
        ? buildPickupAddress(selectedStore)
        : form.shippingAddress.trim();

    const paidType = isInstallment ? PaidType.Installment : PaidType.Full;
    const promotionCodes = lastAppliedPromotionCode ? [lastAppliedPromotionCode] : [];

    const commonPayload = {
      deliveryType: form.deliveryType,
      receiverEmail: form.receiverEmail.trim() || null,
      receiverFullName: form.receiverFullName.trim(),
      shippingAddress: shippingAddress || null,
      trackingPhone: normalizedTrackingPhone,
      paidType,
      receiverIdentityCard: isInstallment
        ? form.receiverIdentityCard.trim()
        : null,
      installmentDurationMonth: isInstallment
        ? Number(form.installmentDurationMonth)
        : null,
      notes: form.notes.trim() || null,
      promotionCodes,
      chosenFreeProductIds,
    };

    const selectedLocalProductIds = selectedItems.map((item) => item.productId);
    const selectedServerItemIds = selectedItems.map((item) => item.serverItemId);

    let createdOrderId = null;
    let cartSynced = false;

    const syncCartAfterCheckout = async () => {
      if (cartSynced) return;

      try {
        if (isAuthenticated) {
          await dispatch(fetchCartItems()).unwrap();
        } else {
          await dispatch(
            removeCheckedOutLocalItems({
              productIds: selectedLocalProductIds,
            }),
          ).unwrap();
        }
      } catch (error) {
        console.error("Failed to sync cart after checkout", error);
      } finally {
        cartSynced = true;
      }
    };

    setSubmitting(true);
    try {
      const response = isAuthenticated
        ? await orderService.memberCheckout({
            ...commonPayload,
            selectedCartItemIds: selectedServerItemIds,
          })
        : await orderService.guestCheckout({
            ...commonPayload,
            items: selectedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          });

      if (!response.succeeded) {
        throw new Error(response.message || "Không thể tạo đơn hàng.");
      }

      const orderData = response.value || {};
      const orderId = orderData.id;
      if (!orderId) {
        throw new Error("Đã tạo đơn hàng nhưng không nhận được mã đơn.");
      }

      createdOrderId = orderId;

      if (
        form.paymentOption === PAYMENT_OPTION.QR ||
        form.paymentOption === PAYMENT_OPTION.INSTALLMENT
      ) {
        let initResponse = null;

        if (form.paymentOption === PAYMENT_OPTION.QR) {
          const returnUrl = `${window.location.origin}/checkout?paymentReturn=1`;
          initResponse = await orderService.initOnlinePayment(orderId, {
            method: ONLINE_PAYMENT_METHOD,
            returnUrl,
          });
        } else {
          let installmentId =
            orderData?.installments?.[0]?.id || orderData?.firstInstallmentId;

          if (!installmentId) {
            const orderDetailResponse = await orderService.getOrderDetail(orderId);
            if (orderDetailResponse.succeeded) {
              installmentId = orderDetailResponse.value?.installments?.[0]?.id;
            }
          }

          if (!installmentId) {
            await syncCartAfterCheckout();
            toast.error(
              "Đơn hàng đã được tạo nhưng chưa xác định được kỳ trả góp đầu tiên.",
            );
            navigate("/");
            return;
          }

          initResponse = await orderService.initInstallmentOnlinePayment(
            installmentId,
            {
              method: ONLINE_PAYMENT_METHOD,
            },
          );
        }

        const paymentRedirectUrl = initResponse?.value?.redirectUrl;

        if (!initResponse?.succeeded || !paymentRedirectUrl) {
          await syncCartAfterCheckout();
          toast.error(
            "Đơn hàng đã được tạo nhưng chưa khởi tạo được thanh toán online.",
          );
          navigate("/");
          return;
        }

        await syncCartAfterCheckout();
        window.location.assign(paymentRedirectUrl);
        return;
      }

      await syncCartAfterCheckout();
      toast.success("Đặt hàng thành công.");
      navigate("/");
    } catch (error) {
      if (createdOrderId) {
        try {
          if (isAuthenticated) {
            await dispatch(fetchCartItems()).unwrap();
          } else {
            await dispatch(
              removeCheckedOutLocalItems({
                productIds: selectedLocalProductIds,
              }),
            ).unwrap();
          }
        } catch (syncError) {
          console.error("Failed to sync cart after order creation error", syncError);
        }

        toast.error(
          error?.message ||
            "Đơn hàng đã được tạo nhưng có lỗi khi khởi tạo bước thanh toán tiếp theo.",
        );
        navigate("/");
      } else {
        toast.error(error?.message || "Đặt hàng thất bại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isPaymentReturn) {
    const { handling, handled, ok, message } = paymentReturnState;

    const title = handling
      ? "Đang xác nhận thanh toán..."
      : ok === true
        ? "Thanh toán thành công"
        : ok === false
          ? "Thanh toán thất bại"
          : "Kết quả thanh toán";

    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mb-6 text-slate-500">
            {message ||
              "Đang xử lý thông tin thanh toán của bạn. Vui lòng chờ trong giây lát."}
          </p>

          {handling && !handled && (
            <div className="mb-6 text-sm text-slate-500">
              Vui lòng không tắt trình duyệt trong khi hệ thống đang xác nhận thanh
              toán.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-10 items-center rounded-md bg-[#0090D0] px-5 text-sm font-medium text-white hover:bg-[#0077B0]"
            >
              Về trang chủ
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">
            Chưa có sản phẩm để thanh toán
          </h1>
          <p className="mb-6 text-slate-500">
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.
          </p>
          <Link
            to="/cart"
            className="inline-flex h-10 items-center rounded-md bg-[#0090D0] px-5 font-medium text-white hover:bg-[#0077B0]"
          >
            Về giỏ hàng
          </Link>
        </div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:text-[#0090D0]">
          Trang chủ
        </Link>{" "}
        /{" "}
        <Link to="/cart" className="hover:text-[#0090D0]">
          Giỏ hàng
        </Link>{" "}
        / <span className="text-slate-700">Thanh toán</span>
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-slate-900 sm:mb-6">
        Thanh toán đơn hàng
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              1. Sản phẩm đã chọn
            </h2>
            <div className="mt-4 space-y-3">
              {selectedItems.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-3 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center"
                >
                  <img
                    src={item.productImage || "https://placehold.co/96x96?text=No+Image"}
                    alt={item.productName}
                    className="h-20 w-20 rounded border border-slate-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Số lượng: {item.quantity}
                    </p>
                    <p className="text-sm text-slate-500">
                      Đơn giá: {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-600">
                    {formatPrice(item.subTotal || item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                2. Thông tin nhận hàng
              </h2>
              <div className="flex items-center gap-2">
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleGoLogin}
                    className="h-9 rounded-md border border-[#0090D0] px-3 text-sm font-medium text-[#0090D0] hover:bg-[#0090D0]/5"
                  >
                    Đăng nhập
                  </button>
                )}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-9 rounded-md border border-red-300 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                label="Họ và tên"
                value={form.receiverFullName}
                onChange={(value) => setField("receiverFullName", value)}
                error={errors.receiverFullName}
                required
              />
              <InputField
                label="Email"
                type="email"
                value={form.receiverEmail}
                onChange={(value) => setField("receiverEmail", value)}
                error={errors.receiverEmail}
                placeholder="Có thể để trống"
              />
              <InputField
                label="Số điện thoại"
                value={form.trackingPhone}
                onChange={(value) => setField("trackingPhone", value)}
                error={errors.trackingPhone}
                required
                disabled={isTrackingPhoneLocked}
                helperText={
                  isTrackingPhoneLocked
                    ? "Số điện thoại được lấy từ tài khoản thành viên và không thể thay đổi."
                    : "Số điện thoại này sẽ được dùng để kiểm tra khuyến mãi và theo dõi đơn hàng."
                }
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Địa chỉ giao hàng"
                  value={form.shippingAddress}
                  onChange={(value) => setField("shippingAddress", value)}
                  error={errors.shippingAddress}
                  required={form.deliveryType === DeliveryType.Shipping}
                  disabled={form.deliveryType === DeliveryType.PickUp}
                  placeholder={
                    form.deliveryType === DeliveryType.PickUp
                      ? "Không cần nhập khi nhận tại cửa hàng"
                      : "Nhập số nhà, đường, phường/xã, tỉnh/thành"
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Ghi chú
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0090D0]"
                  placeholder="Thêm ghi chú cho đơn hàng nếu cần"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <TicketPercent size={18} className="text-[#0090D0]" />
              <h2 className="text-lg font-semibold text-slate-900">
                3. Mã khuyến mãi
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={promotionCode}
                onChange={(event) => handlePromotionCodeChange(event.target.value)}
                className="h-11 rounded border border-slate-300 px-3 text-sm uppercase outline-none focus:border-[#0090D0]"
                placeholder="Nhập mã khuyến mãi"
              />
              <button
                type="button"
                onClick={() =>
                  calculatePromotion({
                    code: promotionCode,
                    mode: "manual",
                  })
                }
                disabled={promotionLoading || selectedItems.length === 0}
                className="h-11 rounded-md bg-[#0090D0] px-4 text-sm font-semibold text-white hover:bg-[#0077B0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {promotionLoading ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
              <button
                type="button"
                onClick={() =>
                  clearPromotionState({
                    preserveCode: false,
                    invalidateRequest: true,
                  })
                }
                className="h-11 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Xóa mã
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Khuyến mãi sẽ được kiểm tra theo các sản phẩm đã chọn và số điện thoại
              ở trên.
            </p>

            {promotionError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {promotionError}
              </div>
            )}

            {hasPromotionDetails && (
              <div className="mt-4 space-y-3">
                {lastAppliedPromotionCode && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    Đang áp dụng mã <span className="font-semibold">{lastAppliedPromotionCode}</span>.
                  </div>
                )}

                {appliedPromotions.map((promotion) => (
                  <div
                    key={promotion.promotionId}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {promotion.promotionName}
                        </div>
                        <div className="text-sm text-slate-500">
                          Mã: {promotion.promotionCode || "Tự động áp dụng"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-red-600">
                        Giảm {formatPrice(promotion.discountAmount)}
                      </div>
                    </div>
                  </div>
                ))}

                {unappliedPromotionMessages.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {unappliedPromotionMessages.map((message) => (
                      <p key={message}>{message}</p>
                    ))}
                  </div>
                )}

                {promotionGroups.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <Gift size={18} className="text-[#0090D0]" />
                      <h3 className="font-semibold text-slate-900">Quà tặng</h3>
                    </div>

                    <div className="mt-4 space-y-4">
                      {promotionGroups.map((group) => (
                        <div key={group.promotionId} className="space-y-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {group.promotionName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {group.isSelectable
                                ? `Chọn ${group.requiredPickCount} sản phẩm quà tặng.`
                                : "Quà tặng được thêm tự động cùng đơn hàng."}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {group.items.map((giftItem) => {
                              const product = giftProductMap[giftItem.productId];
                              const selectedGiftIds =
                                selectedFreeItemsByPromotionId[group.promotionId] || [];
                              const checked = selectedGiftIds.includes(
                                giftItem.productId,
                              );

                              return (
                                <button
                                  key={`${group.promotionId}-${giftItem.productId}`}
                                  type="button"
                                  onClick={() => toggleFreeItem(group, giftItem.productId)}
                                  disabled={!group.isSelectable}
                                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                    checked
                                      ? "border-[#0090D0] bg-[#0090D0]/5"
                                      : "border-slate-200 bg-white"
                                  } ${
                                    group.isSelectable
                                      ? "hover:border-[#0090D0]/50"
                                      : "cursor-default"
                                  }`}
                                >
                                  <img
                                    src={
                                      product?.firstImageUrl ||
                                      "https://placehold.co/80x80?text=Gift"
                                    }
                                    alt={product?.name || giftItem.productId}
                                    className="h-16 w-16 rounded border border-slate-200 object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="line-clamp-2 text-sm font-semibold text-slate-800">
                                      {product?.name || `Sản phẩm #${giftItem.productId}`}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      Số lượng quà: {giftItem.quantity}
                                    </div>
                                    {group.isSelectable ? (
                                      <div className="mt-1 text-xs text-[#0090D0]">
                                        {checked ? "Đã chọn" : "Nhấn để chọn quà"}
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-xs text-emerald-600">
                                        Tự động tặng
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              4. Hình thức nhận hàng
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Bạn có thể nhận tại cửa hàng hoặc giao hàng tận nơi.
            </p>

            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.deliveryType === DeliveryType.Shipping}
                  onChange={() => handleDeliveryChange(DeliveryType.Shipping)}
                />
                <span className="text-sm text-slate-800">Giao hàng tận nơi</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.deliveryType === DeliveryType.PickUp}
                  onChange={() => handleDeliveryChange(DeliveryType.PickUp)}
                />
                <span className="text-sm text-slate-800">Nhận tại cửa hàng</span>
              </label>
            </div>

            {form.deliveryType === DeliveryType.PickUp && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Chọn cửa hàng nhận hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.pickupStoreId}
                  onChange={(event) => setField("pickupStoreId", event.target.value)}
                  className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
                >
                  <option value="">-- Chọn cửa hàng --</option>
                  {PICKUP_STORES.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {errors.pickupStoreId && (
                  <p className="mt-1 text-xs text-red-600">{errors.pickupStoreId}</p>
                )}

                {selectedStore && (
                  <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">{selectedStore.name}</p>
                    <p>{selectedStore.address}</p>
                    <p>{selectedStore.workingHours}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              5. Phương thức thanh toán
            </h2>
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.paymentOption === PAYMENT_OPTION.QR}
                  onChange={() => handlePaymentChange(PAYMENT_OPTION.QR)}
                />
                <span className="text-sm text-slate-800">
                  Thanh toán online qua mã QR
                </span>
              </label>

              {form.deliveryType === DeliveryType.PickUp && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                  <input
                    type="radio"
                    checked={form.paymentOption === PAYMENT_OPTION.COD}
                    onChange={() => handlePaymentChange(PAYMENT_OPTION.COD)}
                  />
                  <span className="text-sm text-slate-800">
                    Thanh toán khi nhận hàng tại cửa hàng
                  </span>
                </label>
              )}

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="radio"
                  checked={form.paymentOption === PAYMENT_OPTION.INSTALLMENT}
                  onChange={() => handlePaymentChange(PAYMENT_OPTION.INSTALLMENT)}
                />
                <span className="text-sm text-slate-800">Trả góp</span>
              </label>
            </div>

            {isInstallment && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputField
                  label="CCCD/CMND"
                  value={form.receiverIdentityCard}
                  onChange={(value) => setField("receiverIdentityCard", value)}
                  error={errors.receiverIdentityCard}
                  required
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Kỳ hạn trả góp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.installmentDurationMonth}
                    onChange={(event) =>
                      setField("installmentDurationMonth", Number(event.target.value))
                    }
                    className="h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#0090D0]"
                  >
                    {INSTALLMENT_OPTIONS.map((month) => (
                      <option key={month} value={month}>
                        {month} tháng
                      </option>
                    ))}
                  </select>
                  {errors.installmentDurationMonth && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.installmentDurationMonth}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-5 lg:h-fit">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Tổng kết đơn hàng
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tổng Sản phẩm</span>
                <span>{selectedItems.length} sp</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatPrice(selectedSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Giảm giá</span>
                <span className="text-emerald-600">
                  -{formatPrice(totalDiscountAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tổng sau giảm</span>
                <span>{formatPrice(taxableAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Thuế VAT (10%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <div className="flex items-center justify-between">
                  <span>Tổng cộng</span>
                  <span className="text-red-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {hasPromotionSummary && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">
                  {lastAppliedPromotionCode
                    ? `Mã khuyến mãi: ${lastAppliedPromotionCode}`
                    : "Khuyến mãi tự động đang áp dụng"}
                </p>
                <p className="mt-1 text-slate-600">
                  Tổng giảm dự kiến: {formatPrice(totalDiscountAmount)}
                </p>
                {chosenFreeProductIds.length > 0 && (
                  <p className="mt-1 text-slate-600">
                    Quà tặng đã chọn: {chosenFreeProductIds.length} sản phẩm
                  </p>
                )}
              </div>
            )}

            {selectedInvalidItems.length > 0 && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Có sản phẩm không hợp lệ trong danh sách thanh toán. Vui lòng quay
                lại giỏ hàng để kiểm tra.
              </div>
            )}

            {incompleteFreeItemSelection && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Bạn cần chọn đủ quà tặng trước khi đặt hàng.
              </div>
            )}

            <button
              type="submit"
              disabled={disableSubmit}
              className="mt-4 h-11 w-full rounded-md bg-green-700 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "ĐANG ĐẶT HÀNG..." : "ĐẶT HÀNG"}
            </button>

            <Link
              to="/cart"
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Quay lại giỏ hàng
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
