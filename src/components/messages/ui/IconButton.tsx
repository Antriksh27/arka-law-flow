
import React from "react";
import { buttonVariants } from "@/components/ui/button";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: "brand-primary" | "brand-tertiary";
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = "brand-primary",
  className,
  ...props
}) => {
  // Map variant to buttonStyles
  const btnClass =
    variant === "brand-primary"
      ? "bg-primary text-white hover:bg-primary/90"
      : "bg-blue-50 text-primary hover:bg-blue-100";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg p-2 transition ${btnClass} ${className ?? ""}`}
      {...props}
    >
      {icon}
    </button>
  );
};
