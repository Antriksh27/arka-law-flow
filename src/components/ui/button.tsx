
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-lg transition-colors outline-offset-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#1E3A8A] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#1E3A8A] text-white shadow-sm hover:bg-[#1D4ED8]",
        secondary: "bg-[#F3F4F6] text-[#1E3A8A] hover:bg-[#E5E7EB] shadow-sm",
        outline:
          "border border-[#E5E7EB] bg-white text-[#1E3A8A] hover:bg-[#F3F4F6] shadow-sm",
        ghost: "hover:bg-blue-50 text-[#1E3A8A]",
        destructive:
          "bg-[#EF4444] text-white hover:bg-red-600 shadow-sm",
        closeCase: "bg-[#EF4444] text-white hover:bg-red-600 shadow-sm",
        link: "text-[#2563EB] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-base",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
