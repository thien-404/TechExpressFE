import { useEffect, useState } from "react";

import { apiService } from "../../../config/axios";
import {
  clearPendingPaymentSessionId,
  readPendingPaymentSessionId,
} from "../../../utils/paymentGateway";

const INITIAL_PAYMENT_RETURN_STATE = {
  handling: false,
  handled: false,
  ok: null,
  cancelled: false,
  message: "",
};

const PAYMENT_SUCCESS_MESSAGE =
  "Thanh toán thành công. Đơn hàng của bạn đang được xử lý.";
const PAYMENT_CANCELED_MESSAGE =
  "Thanh toán đã bị hủy. Đơn hàng chưa được thanh toán.";
const PAYMENT_FAILURE_MESSAGE =
  "Thanh toán thất bại hoặc đã bị hủy. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.";
const PAYMENT_VERIFYING_MESSAGE = "Đang xác nhận thanh toán...";
const PAYMENT_VERIFY_ERROR_MESSAGE =
  "Không thể xác nhận trạng thái thanh toán. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.";

function normalizeGatewayStatus(status) {
  return String(status || "").trim().toUpperCase();
}

export function useCheckoutPaymentReturn({
  isPaymentReturn,
  orderCode,
  querySessionId,
  gatewayId,
  paymentStatus,
  isCanceled,
  useBackendReturnCancel,
}) {
  const [paymentReturnState, setPaymentReturnState] = useState(
    INITIAL_PAYMENT_RETURN_STATE
  );

  useEffect(() => {
    if (!isPaymentReturn) {
      setPaymentReturnState(INITIAL_PAYMENT_RETURN_STATE);
      return;
    }

    const resolvedSessionId = querySessionId || readPendingPaymentSessionId();
    const hasGatewayReference = Boolean(orderCode || querySessionId || gatewayId);
    const normalizedPaymentStatus = normalizeGatewayStatus(paymentStatus);
    const isCancelledStatus =
      isCanceled ||
      normalizedPaymentStatus === "CANCELLED" ||
      normalizedPaymentStatus === "CANCELED";
    const isSuccessStatus =
      normalizedPaymentStatus === "PAID" && !isCancelledStatus;
    const fallbackMessage = isSuccessStatus
      ? PAYMENT_SUCCESS_MESSAGE
      : isCancelledStatus
        ? PAYMENT_CANCELED_MESSAGE
        : PAYMENT_FAILURE_MESSAGE;

    const finish = (nextState) => {
      setPaymentReturnState(nextState);
      clearPendingPaymentSessionId();
    };

    if (!orderCode && !resolvedSessionId) {
      finish({
        handling: false,
        handled: true,
        ok: hasGatewayReference ? isSuccessStatus : false,
        cancelled: hasGatewayReference ? isCancelledStatus : false,
        message: hasGatewayReference
          ? fallbackMessage
          : "Không tìm thấy thông tin thanh toán để xác nhận.",
      });
      return;
    }

    const run = async () => {
      setPaymentReturnState({
        handling: true,
        handled: false,
        ok: null,
        cancelled: false,
        message: PAYMENT_VERIFYING_MESSAGE,
      });

      if (!useBackendReturnCancel) {
        finish({
          handling: false,
          handled: true,
          ok: isSuccessStatus,
          cancelled: isCancelledStatus,
          message: fallbackMessage,
        });
        return;
      }

      try {
        const endpoint = isSuccessStatus
          ? "/payments/payos/return"
          : "/payments/payos/cancel";
        const response = await apiService.get(endpoint, {
          orderCode: orderCode || undefined,
          sessionId: orderCode ? undefined : resolvedSessionId || undefined,
        });

        if (Number(response?.status) >= 400) {
          throw new Error(response?.message || PAYMENT_VERIFY_ERROR_MESSAGE);
        }

        const callbackProcessed = Boolean(response?.value?.ok);
        const ok = isSuccessStatus && callbackProcessed;
        const cancelled = isCancelledStatus && !isSuccessStatus;

        finish({
          handling: false,
          handled: true,
          ok,
          cancelled,
          message: ok
            ? PAYMENT_SUCCESS_MESSAGE
            : cancelled
              ? PAYMENT_CANCELED_MESSAGE
              : response?.message || PAYMENT_FAILURE_MESSAGE,
        });
      } catch (error) {
        finish({
          handling: false,
          handled: true,
          ok: false,
          cancelled: isCancelledStatus,
          message: error?.message || PAYMENT_VERIFY_ERROR_MESSAGE,
        });
      }
    };

    void run();
  }, [
    gatewayId,
    isCanceled,
    isPaymentReturn,
    orderCode,
    paymentStatus,
    querySessionId,
    useBackendReturnCancel,
  ]);

  return paymentReturnState;
}
