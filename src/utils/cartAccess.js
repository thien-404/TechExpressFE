export const ADMIN_ROLE = "Admin";

export const CART_ACCESS_DENIED_MESSAGE =
  "Tai khoan admin khong the su dung gio hang o khu vuc khach hang.";

export function isCartRestrictedUser(user) {
  return user?.role === ADMIN_ROLE;
}

export function canUserUseCart(user) {
  return !isCartRestrictedUser(user);
}
