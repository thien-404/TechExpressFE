import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import useCartAccess from "../../hooks/useCartAccess";
import { CART_ACCESS_DENIED_MESSAGE } from "../../utils/cartAccess";

export default function CartAccessRoute({ children }) {
  const location = useLocation();
  const { loading, isCartRestricted } = useCartAccess();
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (loading || !isCartRestricted || hasNotifiedRef.current) return;

    hasNotifiedRef.current = true;
    toast.info(CART_ACCESS_DENIED_MESSAGE);
  }, [isCartRestricted, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isCartRestricted) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
