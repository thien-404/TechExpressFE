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
  message: "",
};

const PAYMENT_SUCCESS_MESSAGE =
  "Thanh toán thành công. Đơn hàng của bạn đang được xử lý.";
const PAYMENT_FAILURE_MESSAGE =
  "Thanh toán thất bại hoặc đã bị hủy. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.";
const PAYMENT_VERIFYING_MESSAGE = "Đang xác nhận thanh toán...";

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
    INITIAL_PAYMENT_RETURN_STATE,
  );

  useEffect(() => {
    if (!isPaymentReturn) {
      setPaymentReturnState(INITIAL_PAYMENT_RETURN_STATE);
      return;
    }

    const resolvedSessionId = querySessionId || readPendingPaymentSessionId();
    const hasGatewayReference = Boolean(orderCode || querySessionId || gatewayId);
    const isSuccessStatus =
      String(paymentStatus || "").toUpperCase() === "PAID" && !isCanceled;
    const fallbackMessage = isSuccessStatus
      ? PAYMENT_SUCCESS_MESSAGE
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
        message: PAYMENT_VERIFYING_MESSAGE,
      });

      if (!useBackendReturnCancel) {
        finish({
          handling: false,
          handled: true,
          ok: isSuccessStatus,
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
          throw new Error(
            response?.message ||
              "Không thể xác nhận trạng thái thanh toán. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.",
          );
        }

        const ok = Boolean(response?.value?.ok);
        finish({
          handling: false,
          handled: true,
          ok,
          message: response?.message || (ok ? PAYMENT_SUCCESS_MESSAGE : PAYMENT_FAILURE_MESSAGE),
        });
      } catch (error) {
        finish({
          handling: false,
          handled: true,
          ok: false,
          message:
            error?.message ||
            "Không thể xác nhận trạng thái thanh toán. Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ.",
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
