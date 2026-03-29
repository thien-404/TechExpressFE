function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getCartLineRawSubtotal(item) {
  const quantity = Math.max(toFiniteNumber(item?.quantity), 0);
  const unitPrice = Math.max(toFiniteNumber(item?.unitPrice), 0);
  const providedSubtotal = toFiniteNumber(item?.subTotal);

  if (providedSubtotal > 0) {
    return providedSubtotal;
  }

  return unitPrice * quantity;
}

export function getCartLineDisplaySubtotal(item) {
  const rawSubtotal = getCartLineRawSubtotal(item);
  const discountedSubtotal = Number(item?.discountedSubTotal);

  if (!item?.hasCartPromotion) {
    return rawSubtotal;
  }

  if (!Number.isFinite(discountedSubtotal)) {
    return rawSubtotal;
  }

  return Math.max(discountedSubtotal, 0);
}

export function getCartLineDiscountedUnitPrice(item) {
  const unitPrice = Math.max(toFiniteNumber(item?.unitPrice), 0);
  const discountAmountPerItem = Math.max(
    toFiniteNumber(item?.discountAmountPerItem),
    0,
  );

  return Math.max(unitPrice - discountAmountPerItem, 0);
}

export function getCartLineSavings(item) {
  return Math.max(
    getCartLineRawSubtotal(item) - getCartLineDisplaySubtotal(item),
    0,
  );
}

export function getCartRawSubtotal(items = []) {
  return items.reduce((total, item) => total + getCartLineRawSubtotal(item), 0);
}

export function getCartDisplaySubtotal(items = []) {
  return items.reduce(
    (total, item) => total + getCartLineDisplaySubtotal(item),
    0,
  );
}

export function getCartSavingsTotal(items = []) {
  return items.reduce((total, item) => total + getCartLineSavings(item), 0);
}
