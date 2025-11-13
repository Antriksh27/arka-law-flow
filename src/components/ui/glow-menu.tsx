"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
interface MenuItem {
  icon: LucideIcon | React.FC;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}
interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
}
const itemVariants = {
  initial: {
    rotateX: 0,
    opacity: 1
  },
  hover: {
    rotateX: -90,
    opacity: 0
  }
};
const backVariants = {
  initial: {
    rotateX: 90,
    opacity: 0
  },
  hover: {
    rotateX: 0,
    opacity: 1
  }
};
const glowVariants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const
      },
      scale: {
        duration: 0.5,
        type: "spring" as const,
        stiffness: 300,
        damping: 25
      }
    }
  }
};
const navGlowVariants = {
  initial: {
    opacity: 0
  },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const
    }
  }
};
const sharedTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5
};
export const MenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(({
  className,
  items,
  activeItem,
  onItemClick
}, ref) => {
  const {
    theme
  } = useTheme();
  const isDarkTheme = theme === "dark";
  return <motion.nav ref={ref} className={cn("w-full px-4 py-2 rounded-full bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden", className)} initial="initial" whileHover="hover">
        <ul className="flex items-center justify-center gap-1 relative z-10 overflow-x-auto scrollbar-hide px-2">
          {items.map(item => {
        const Icon = item.icon;
        const isActive = item.label === activeItem;
        return <motion.li key={item.label} className="relative flex-shrink-0">
                <button onClick={() => onItemClick?.(item.label)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200", isActive ? "bg-white/10 text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/5")}>
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap text-sm font-medium text-[#ebde90]">{item.label}</span>
                </button>
              </motion.li>;
      })}
        </ul>
      </motion.nav>;
});
MenuBar.displayName = "MenuBar";