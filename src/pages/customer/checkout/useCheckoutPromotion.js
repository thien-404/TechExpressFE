import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiService } from "../../../config/axios";
import { promotionService } from "../../../services/promotionService";
import { PHONE_REGEX } from "./constants";
import {
  buildCheckoutItemsSignature,
  buildPromotionGroups,
  mapCheckoutItemsToRequestItems,
  normalizePhone,
} from "./utils";

export function useCheckoutPromotion({ checkoutItems, trackingPhone }) {
  const lastPromotionContextRef = useRef("");
  const promotionRequestSequenceRef = useRef(0);

  const [promotionCode, setPromotionCode] = useState("");
  const [lastAppliedPromotionCode, setLastAppliedPromotionCode] = useState("");
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState("");
  const [promotionResult, setPromotionResult] = useState(null);
  const [selectedFreeItemsByPromotionId, setSelectedFreeItemsByPromotionId] =
    useState({});

  const checkoutItemsSignature = useMemo(
    () => buildCheckoutItemsSignature(checkoutItems),
    [checkoutItems],
  );
  const normalizedTrackingPhone = normalizePhone(trackingPhone);
  const normalizedPromotionCode = promotionCode.trim().toUpperCase();
  const appliedPromotionCode = lastAppliedPromotionCode.trim().toUpperCase();

  const promotionGroups = useMemo(
    () => buildPromotionGroups(promotionResult),
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
          const response = await apiService.get(`/product/${productId}`);

          if (response?.status === 200 && response.value) {
            return [productId, response.value];
          }

          return [productId, null];
        }),
      );

      return Object.fromEntries(entries);
    },
    staleTime: 60000,
  });

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
      setLastAppliedPromotionCode((prev) => (preserveAppliedCode ? prev : ""));
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
      const nextPhone = normalizePhone(trackingPhone);
      const nextContextKey = `${nextCode}|${checkoutItemsSignature}|${nextPhone}`;
      const autoContextKey = `|${checkoutItemsSignature}|${nextPhone}`;
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

      if (checkoutItems.length === 0) {
        if (isManual) {
          const message =
            "Không có sản phẩm nào trong giỏ hàng để áp dụng khuyến mãi.";
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
          checkoutItems: mapCheckoutItemsToRequestItems(checkoutItems),
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
    [checkoutItems, checkoutItemsSignature, clearPromotionState, trackingPhone],
  );

  const promotionContextKey = `${appliedPromotionCode}|${checkoutItemsSignature}|${normalizedTrackingPhone}`;
  const canCalculatePromotion =
    checkoutItems.length > 0 && PHONE_REGEX.test(normalizedTrackingPhone);

  useEffect(() => {
    if (!canCalculatePromotion) {
      if (hasPromotionState) {
        clearPromotionState({
          preserveCode: true,
          preserveAppliedCode: Boolean(appliedPromotionCode),
          invalidateRequest: true,
        });
      } else {
        lastPromotionContextRef.current = "";
      }
      return;
    }

    if (promotionContextKey === lastPromotionContextRef.current) return;

    void calculatePromotion({
      code: appliedPromotionCode,
      mode: "auto",
    });
  }, [
    appliedPromotionCode,
    calculatePromotion,
    canCalculatePromotion,
    clearPromotionState,
    hasPromotionState,
    promotionContextKey,
  ]);

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
  const totalDiscountAmount = Math.max(
    Number(promotionResult?.totalDiscountAmount) || 0,
    0,
  );
  const hasPromotionDetails =
    appliedPromotions.length > 0 ||
    unappliedPromotionMessages.length > 0 ||
    promotionGroups.length > 0;
  const hasPromotionSummary =
    hasPromotionDetails ||
    totalDiscountAmount > 0 ||
    chosenFreeProductIds.length > 0;
  const incompleteFreeItemSelection = promotionGroups.some((group) => {
    if (!group.isSelectable) return false;

    return (
      (selectedFreeItemsByPromotionId[group.promotionId] || []).length !==
      group.requiredPickCount
    );
  });

  const handlePromotionCodeChange = useCallback(
    (value) => {
      const nextValue = value.toUpperCase();
      setPromotionCode(nextValue);

      if (nextValue.trim().toUpperCase() !== appliedPromotionCode) {
        clearPromotionState({
          preserveCode: true,
          invalidateRequest: true,
        });
      }
    },
    [appliedPromotionCode, clearPromotionState],
  );

  const toggleFreeItem = useCallback((group, productId) => {
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
  }, []);

  return {
    promotionCode,
    normalizedPromotionCode,
    lastAppliedPromotionCode,
    promotionLoading,
    promotionError,
    appliedPromotions,
    unappliedPromotionMessages,
    promotionGroups,
    giftProductMap,
    selectedFreeItemsByPromotionId,
    chosenFreeProductIds,
    incompleteFreeItemSelection,
    totalDiscountAmount,
    hasPromotionDetails,
    hasPromotionSummary,
    clearPromotionState,
    calculatePromotion,
    handlePromotionCodeChange,
    toggleFreeItem,
  };
}
