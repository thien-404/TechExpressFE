function toCurrencyNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeProductPricing(product) {
  const originalPrice = Math.max(
    toCurrencyNumber(product?.price ?? product?.unitPrice ?? product?.salePrice) ?? 0,
    0
  );
  const displayPriceCandidate = toCurrencyNumber(product?.priceAfterDiscount);
  const displayPrice =
    displayPriceCandidate === null ? originalPrice : Math.max(displayPriceCandidate, 0);
  const discountAmount = Math.max(toCurrencyNumber(product?.discountValue) ?? 0, 0);
  const hasDiscount = discountAmount > 0 && displayPrice < originalPrice;

  return {
    originalPrice,
    displayPrice: hasDiscount ? displayPrice : originalPrice,
    discountAmount: hasDiscount ? discountAmount : 0,
    hasDiscount,
  };
}
