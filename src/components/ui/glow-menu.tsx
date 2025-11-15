"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MenuItem {
  icon: LucideIcon | React.FC
  label: string
  href: string
  gradient: string
  iconColor: string
}

interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuItem[]
  activeItem?: string
  onItemClick?: (label: string) => void
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
      scale: { duration: 0.5, type: "spring" as const, stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
}

const sharedTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export const MenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(
  ({ className, items, activeItem, onItemClick }, ref) => {
    const { theme } = useTheme()
    const isDarkTheme = theme === "dark"

    return (
      <motion.nav
        ref={ref}
        className={cn(
          "p-1.5 rounded-xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-sm relative overflow-visible",
          className,
        )}
        initial="initial"
        whileHover="hover"
      >
        <motion.div
          className={`absolute -inset-1 bg-gradient-radial from-transparent ${
            isDarkTheme
              ? "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%"
              : "via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90%"
          } to-transparent rounded-2xl z-0 pointer-events-none`}
          variants={navGlowVariants}
        />
        <ul className="flex items-center gap-1.5 relative z-10 overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.label === activeItem

            return (
              <motion.li key={item.label} className="relative">
                <button
                  onClick={() => onItemClick?.(item.label)}
                  className="block w-full"
                >
                  <motion.div
                    className="block rounded-lg overflow-visible group relative"
                    style={{ perspective: "600px" }}
                    whileHover="hover"
                    initial="initial"
                  >
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none"
                      variants={glowVariants}
                      animate={isActive ? "hover" : "initial"}
                      style={{
                        background: item.gradient,
                        opacity: isActive ? 1 : 0,
                        borderRadius: "8px",
                      }}
                    />
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 relative z-10 bg-transparent transition-colors rounded-lg whitespace-nowrap",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                      variants={itemVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center bottom",
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300",
                          isActive ? item.iconColor : "text-foreground",
                          `group-hover:${item.iconColor}`,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 absolute inset-0 z-10 bg-transparent transition-colors rounded-lg whitespace-nowrap",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                      variants={backVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center top",
                        rotateX: 90,
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300",
                          isActive ? item.iconColor : "text-foreground",
                          `group-hover:${item.iconColor}`,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                  </motion.div>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </motion.nav>
    )
  },
)

MenuBar.displayName = "MenuBar"