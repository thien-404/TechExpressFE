import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import useCartSignalR from "../../hooks/useCartSignalR";
import useCartAccess from "../../hooks/useCartAccess";
import {
  bootstrapCart,
  clearCartUiState,
  syncCartAfterLogin,
} from "../../store/slices/cartSlice";

export default function CartBootstrap() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, canUseCart } = useCartAccess();
  const lastModeRef = useRef(null);

  useCartSignalR({ enabled: !loading && isAuthenticated && canUseCart });

  useEffect(() => {
    if (loading) return;

    const nextMode = !canUseCart ? "restricted" : isAuthenticated ? "auth" : "guest";
    if (lastModeRef.current === nextMode) return;
    lastModeRef.current = nextMode;

    if (!canUseCart) {
      dispatch(clearCartUiState());
      return;
    }

    dispatch(bootstrapCart({ isAuthenticated }));
    if (isAuthenticated) {
      dispatch(syncCartAfterLogin())
        .unwrap()
        .catch((error) => {
          toast.error(error || "Không thể đồng bộ giỏ hàng với hệ thống");
        });
    }
  }, [canUseCart, dispatch, isAuthenticated, loading]);

  return null;
}
