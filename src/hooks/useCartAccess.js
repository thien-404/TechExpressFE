import { useAuth } from "../store/authContext";
import { canUserUseCart, isCartRestrictedUser } from "../utils/cartAccess";

export default function useCartAccess() {
  const auth = useAuth();

  return {
    ...auth,
    canUseCart: canUserUseCart(auth.user),
    isCartRestricted: isCartRestrictedUser(auth.user),
  };
}
