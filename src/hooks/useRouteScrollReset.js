import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function useRouteScrollReset({ targetRef } = {}) {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (previousPathname === pathname || navigationType === "POP") {
      return;
    }

    const scrollTarget = targetRef?.current;

    if (scrollTarget && typeof scrollTarget.scrollTo === "function") {
      scrollTarget.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [navigationType, pathname, targetRef]);
}
