import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll position on route change.
 * App layouts use a scrollable <main> element (not the window),
 * so we scroll that element as well as the window for safety.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Window (used by public/auth routes)
    window.scrollTo({ top: 0, left: 0 });
    // Authenticated layouts: scroll the <main> container
    document.querySelectorAll("main").forEach((el) => {
      el.scrollTo({ top: 0, left: 0 });
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
