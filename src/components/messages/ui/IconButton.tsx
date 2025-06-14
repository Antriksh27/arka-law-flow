
import React from "react";

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
  const btnClass =
    variant === "brand-primary"
      ? "bg-primary text-white hover:bg-primary/90"
      : "bg-primary-50 text-primary hover:bg-primary-100";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${btnClass} ${className ?? ""}`}
      {...props}
    >
      {icon}
    </button>
  );
};
