import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scroll restoration:
 *  - PUSH/REPLACE → scroll the route's main container to top
 *  - POP (back/forward) → restore the previous scroll position for that history entry
 *
 * Saves position keyed by location.key so each history entry has its own snapshot.
 */
const positions = new Map<string, number>();

const getMain = (): HTMLElement | null =>
  document.querySelector("main") as HTMLElement | null;

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType(); // "PUSH" | "REPLACE" | "POP"
  const prevKey = useRef<string>(location.key);

  // Save scroll position of the OUTGOING entry before the route changes
  useEffect(() => {
    const main = getMain();
    if (!main) return;
    const onScroll = () => {
      positions.set(prevKey.current, main.scrollTop);
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      // capture final position on unmount/route change
      positions.set(prevKey.current, main.scrollTop);
      main.removeEventListener("scroll", onScroll);
    };
  }, [location.key]);

  useEffect(() => {
    const main = getMain();
    const target =
      navType === "POP" ? positions.get(location.key) ?? 0 : 0;

    // Restore on next frame so layout/data has settled
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: target, left: 0 });
      if (main) main.scrollTop = target;
    });

    prevKey.current = location.key;
    return () => cancelAnimationFrame(raf);
  }, [location.key, navType]);

  return null;
};

export default ScrollToTop;
