import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SlideTabsProps {
  items: TabItem[];
}

export const SlideTabs: React.FC<SlideTabsProps> = ({ items }) => {
  const location = useLocation();
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);

  // Find the index of the currently active tab based on the route
  const getActiveIndex = () => {
    const currentPath = location.pathname;
    const activeIndex = items.findIndex((item) => {
      if (item.href === "/") {
        return currentPath === "/";
      }
      return currentPath.startsWith(item.href);
    });
    return activeIndex >= 0 ? activeIndex : 0;
  };

  const selected = getActiveIndex();

  // Update cursor position when selected tab changes
  useEffect(() => {
    const selectedTab = tabsRef.current[selected];
    if (selectedTab) {
      const { width } = selectedTab.getBoundingClientRect();
      setPosition({
        left: selectedTab.offsetLeft,
        width,
        opacity: 1,
      });
    }
  }, [selected]);

  return (
    <ul
      onMouseLeave={() => {
        const selectedTab = tabsRef.current[selected];
        if (selectedTab) {
          const { width } = selectedTab.getBoundingClientRect();
          setPosition({
            left: selectedTab.offsetLeft,
            width,
            opacity: 1,
          });
        }
      }}
      className="relative mx-auto flex w-fit rounded-full border-2 border-white/20 bg-slate-800 p-1"
    >
      {items.map((tab, i) => (
        <Tab
          key={tab.href}
          ref={(el) => (tabsRef.current[i] = el)}
          setPosition={setPosition}
          href={tab.href}
          isActive={i === selected}
        >
          {tab.label}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
};

interface TabProps {
  children: React.ReactNode;
  setPosition: (position: { left: number; width: number; opacity: number }) => void;
  href: string;
  isActive: boolean;
}

const Tab = React.forwardRef<HTMLLIElement, TabProps>(
  ({ children, setPosition, href, isActive }, ref) => {
    return (
      <li
        ref={ref}
        onMouseEnter={(e) => {
          const target = e.currentTarget;
          if (!target) return;

          const { width } = target.getBoundingClientRect();

          setPosition({
            left: target.offsetLeft,
            width,
            opacity: 1,
          });
        }}
        className="relative z-10 block cursor-pointer"
      >
        <Link
          to={href}
          className="block px-3 py-1.5 text-xs uppercase text-white mix-blend-difference md:px-5 md:py-3 md:text-base font-medium"
        >
          {children}
        </Link>
      </li>
    );
  }
);

Tab.displayName = "Tab";

interface CursorProps {
  position: {
    left: number;
    width: number;
    opacity: number;
  };
}

const Cursor: React.FC<CursorProps> = ({ position }) => {
  return (
    <motion.li
      animate={{
        ...position,
      }}
      className="absolute z-0 h-7 rounded-full bg-white md:h-12"
    />
  );
};
