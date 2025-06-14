
import React from "react";

interface TextFieldUnstyledProps {
  className?: string;
  children: React.ReactNode;
}
export const TextFieldUnstyled: React.FC<TextFieldUnstyledProps> & {
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
} = ({ className = "", children }) => (
  <div className={`w-full ${className}`}>{children}</div>
);

TextFieldUnstyled.Input = ({ className = "", ...props }) => (
  <input
    className={`w-full border-none outline-none bg-transparent text-base focus:ring-0 placeholder:text-gray-500 ${className}`}
    {...props}
  />
);
