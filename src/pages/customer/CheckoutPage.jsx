import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiService } from "../../config/axios";
import { orderService } from "../../services/orderService";
import {
  fetchCartItems,
  removeCheckedOutLocalItems,
  selectCartCanCheckout,
  selectCartCheckoutItems,
  selectCartDisplaySubtotal,
  selectCartProductSavings,
} from "../../store/slices/cartSlice";
import { useAuth } from "../../store/authContext";
import {
  buildCheckoutPaymentUrls,
  storePendingPaymentSessionId,
} from "../../utils/paymentGateway";
import {
  CheckoutEmptyView,
  CheckoutFormView,
  CheckoutPaymentReturnView,
} from "./checkout/CheckoutViews";
import {
  DeliveryType,
  ONLINE_PAYMENT_METHOD,
  PaidType,
  PAYMENT_OPTION,
  PICKUP_STORES,
  SHIPPING_FEE,
  createInitialCheckoutForm,
} from "./checkout/constants";
import { useCheckoutPaymentReturn } from "./checkout/useCheckoutPaymentReturn";
import { useCheckoutPromotion } from "./checkout/useCheckoutPromotion";
import {
  buildPickupAddress,
  getCombinedAddress,
  getCombinedName,
  isCheckoutItemInvalid,
  normalizePhone,
  validateCheckoutForm,
} from "./checkout/utils";

async function fetchCurrentUserProfile() {
  const response = await apiService.get("/user/me");

  if (response?.status !== 200 || !response.value) {
    throw new Error(response?.message || "Không thể lấy thông tin người dùng.");
  }

  return response.value;
}

function getInstallmentIdFromOrder(orderData) {
  return orderData?.installments?.[0]?.id || orderData?.firstInstallmentId || null;
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  const checkoutItems = useSelector(selectCartCheckoutItems);
  const subtotal = useSelector(selectCartDisplaySubtotal);
  const productSavings = useSelector(selectCartProductSavings);
  const canCheckout = useSelector(selectCartCanCheckout);

  const didPrefillRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => createInitialCheckoutForm());

  const paymentQuery = {
    isPaymentReturn: searchParams.get("paymentReturn") === "1",
    orderCode: searchParams.get("orderCode") || "",
    querySessionId: searchParams.get("sessionId") || "",
    gatewayId: searchParams.get("id") || "",
    paymentStatus: searchParams.get("status") || "",
    isCanceled: searchParams.get("cancel") === "true",
  };
  const useBackendReturnCancel =
    import.meta.env.VITE_USE_BACKEND_RETURN_CANCEL !== "0";

  const paymentReturnState = useCheckoutPaymentReturn({
    ...paymentQuery,
    useBackendReturnCancel,
  });

  const { data: userMe } = useQuery({
    enabled: isAuthenticated,
    queryKey: ["checkout-user-me"],
    queryFn: fetchCurrentUserProfile,
    staleTime: 60000,
  });

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

  const invalidItems = useMemo(
    () => checkoutItems.filter(isCheckoutItemInvalid),
    [checkoutItems],
  );
  const isInstallment = form.paymentOption === PAYMENT_OPTION.INSTALLMENT;
  const selectedStore = useMemo(
    () => PICKUP_STORES.find((store) => store.id === form.pickupStoreId) || null,
    [form.pickupStoreId],
  );

  const promotionState = useCheckoutPromotion({
    checkoutItems,
    trackingPhone: form.trackingPhone,
  });

  const overlappingPromotionDiscount = Math.min(
    productSavings,
    promotionState.totalDiscountAmount,
  );
  const effectivePromotionDiscount = Math.max(
    promotionState.totalDiscountAmount - overlappingPromotionDiscount,
    0,
  );
  const taxableAmount = Math.max(
    0,
    subtotal - effectivePromotionDiscount,
  );
  const shippingFee =
    form.deliveryType === DeliveryType.PickUp ? 0 : SHIPPING_FEE;
  const tax = Math.round(taxableAmount * 0.1);
  const total = Math.max(0, taxableAmount + shippingFee + tax);
  const disableSubmit =
    submitting ||
    authLoading ||
    !canCheckout ||
    checkoutItems.length === 0 ||
    invalidItems.length > 0 ||
    promotionState.incompleteFreeItemSelection;

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: "" };
    });
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
    }));
    setErrors((prev) => ({
      ...prev,
      shippingAddress: "",
      pickupStoreId: "",
    }));
  };

  const handleGoLogin = () => {
    navigate("/login?redirect=/checkout");
  };

  const handleLogout = () => {
    logout();
    didPrefillRef.current = false;
    setErrors({});
    setForm(createInitialCheckoutForm());
    promotionState.clearPromotionState({
      preserveCode: false,
      invalidateRequest: true,
    });
    toast.success("Đã đăng xuất");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disableSubmit) return;

    if (checkoutItems.length === 0) {
      toast.error("Không có sản phẩm nào trong giỏ hàng để thanh toán.");
      navigate("/cart");
      return;
    }

    if (invalidItems.length > 0) {
      toast.error("Có sản phẩm không hợp lệ trong danh sách thanh toán.");
      return;
    }

    if (isAuthenticated && checkoutItems.some((item) => !item.serverItemId)) {
      toast.error("Giỏ hàng chưa đồng bộ với máy chủ. Vui lòng thử lại.");
      return;
    }

    const normalizedTrackingPhone = normalizePhone(form.trackingPhone);
    if (
      promotionState.normalizedPromotionCode &&
      promotionState.normalizedPromotionCode !==
        promotionState.lastAppliedPromotionCode.trim().toUpperCase()
    ) {
      toast.error("Vui lòng áp dụng lại mã khuyến mãi trước khi đặt hàng.");
      return;
    }

    if (
      isTrackingPhoneLocked &&
      normalizedTrackingPhone !== lockedTrackingPhone
    ) {
      toast.error("Số điện thoại phải trùng với số đã lưu trong tài khoản.");
      return;
    }

    if (promotionState.incompleteFreeItemSelection) {
      toast.error("Vui lòng chọn đủ quà tặng trước khi đặt hàng.");
      return;
    }

    const nextErrors = validateCheckoutForm(form, { isInstallment });
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
    const promotionCodes = promotionState.lastAppliedPromotionCode
      ? [promotionState.lastAppliedPromotionCode]
      : [];
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
      chosenFreeProductIds: promotionState.chosenFreeProductIds,
    };

    const selectedLocalProductIds = checkoutItems.map((item) => item.productId);
    const selectedServerItemIds = checkoutItems.map((item) => item.serverItemId);
    let cartSynced = false;
    let orderCreated = false;

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
            items: checkoutItems.map((item) => ({
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

      orderCreated = true;

      if (
        form.paymentOption === PAYMENT_OPTION.QR ||
        form.paymentOption === PAYMENT_OPTION.INSTALLMENT
      ) {
        const { returnUrl, cancelUrl } = buildCheckoutPaymentUrls(
          window.location.origin,
        );
        let initResponse = null;

        if (form.paymentOption === PAYMENT_OPTION.QR) {
          initResponse = await orderService.initOnlinePayment(orderId, {
            method: ONLINE_PAYMENT_METHOD,
            returnUrl,
            cancelUrl,
          });
        } else {
          let installmentId = getInstallmentIdFromOrder(orderData);

          if (!installmentId) {
            const orderDetailResponse = await orderService.getOrderDetail(orderId);
            if (orderDetailResponse.succeeded) {
              installmentId = getInstallmentIdFromOrder(orderDetailResponse.value);
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
              returnUrl,
              cancelUrl,
            },
          );
        }

        const paymentRedirectUrl = initResponse?.value?.redirectUrl;
        const paymentSessionId = initResponse?.value?.sessionId;

        if (!initResponse?.succeeded || !paymentRedirectUrl) {
          await syncCartAfterCheckout();
          toast.error(
            "Đơn hàng đã được tạo nhưng chưa khởi tạo được thanh toán online.",
          );
          navigate("/");
          return;
        }

        storePendingPaymentSessionId(paymentSessionId);
        await syncCartAfterCheckout();
        window.location.assign(paymentRedirectUrl);
        return;
      }

      await syncCartAfterCheckout();
      toast.success("Đặt hàng thành công.");
      navigate("/");
    } catch (error) {
      if (orderCreated) {
        await syncCartAfterCheckout();
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

  if (paymentQuery.isPaymentReturn) {
    return (
      <CheckoutPaymentReturnView paymentReturnState={paymentReturnState} />
    );
  }

  if (checkoutItems.length === 0) {
    return <CheckoutEmptyView />;
  }

  return (
    <CheckoutFormView
      cartState={{
        checkoutItems,
        invalidItems,
      }}
      authState={{
        isAuthenticated,
        isTrackingPhoneLocked,
      }}
      formState={{
        form,
        errors,
        isInstallment,
        selectedStore,
        submitting,
        disableSubmit,
      }}
      promotionState={{
        promotionCode: promotionState.promotionCode,
        promotionLoading: promotionState.promotionLoading,
        promotionError: promotionState.promotionError,
        lastAppliedPromotionCode: promotionState.lastAppliedPromotionCode,
        appliedPromotions: promotionState.appliedPromotions,
        unappliedPromotionMessages: promotionState.unappliedPromotionMessages,
        hasPromotionDetails: promotionState.hasPromotionDetails,
        hasPromotionSummary: promotionState.hasPromotionSummary,
        promotionGroups: promotionState.promotionGroups,
        giftProductMap: promotionState.giftProductMap,
        selectedFreeItemsByPromotionId:
          promotionState.selectedFreeItemsByPromotionId,
        chosenFreeProductIds: promotionState.chosenFreeProductIds,
        incompleteFreeItemSelection:
          promotionState.incompleteFreeItemSelection,
      }}
      summaryState={{
        subtotal,
        productSavings,
        totalDiscountAmount: promotionState.totalDiscountAmount,
        effectivePromotionDiscount,
        overlappingPromotionDiscount,
        taxableAmount,
        shippingFee,
        tax,
        total,
      }}
      handlers={{
        onSubmit: handleSubmit,
        onGoLogin: handleGoLogin,
        onLogout: handleLogout,
        onFieldChange: setField,
        onPromotionCodeChange: promotionState.handlePromotionCodeChange,
        onApplyPromotion: () =>
          promotionState.calculatePromotion({
            code: promotionState.promotionCode,
            mode: "manual",
          }),
        onClearPromotion: () =>
          promotionState.clearPromotionState({
            preserveCode: false,
            invalidateRequest: true,
          }),
        onToggleGift: promotionState.toggleFreeItem,
        onDeliveryChange: handleDeliveryChange,
        onPaymentChange: handlePaymentChange,
      }}
    />
  );
}
