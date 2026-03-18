export const ADMIN_ROLE = "Admin";

export const CART_ACCESS_DENIED_MESSAGE =
  "Tài khoản admin không thể sử dụng giỏ hàng ở khu vực khách hàng.";

export function isCartRestrictedUser(user) {
  return user?.role === ADMIN_ROLE;
}

export function canUserUseCart(user) {
  return !isCartRestrictedUser(user);
}
