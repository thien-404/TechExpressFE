import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAuth } from "../../store/authContext";
import { bootstrapCart, syncCartAfterLogin } from "../../store/slices/cartSlice";

export default function CartBootstrap() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useAuth();
  const lastModeRef = useRef(null);

  useEffect(() => {
    if (loading) return;

    const nextMode = isAuthenticated ? "auth" : "guest";
    if (lastModeRef.current === nextMode) return;
    lastModeRef.current = nextMode;

    dispatch(bootstrapCart({ isAuthenticated }));
    if (isAuthenticated) {
      dispatch(syncCartAfterLogin())
        .unwrap()
        .catch((error) => {
          toast.error(error || "Khong the dong bo gio hang voi he thong");
        });
    }
  }, [dispatch, isAuthenticated, loading]);

  return null;
}
