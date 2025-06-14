
import React from "react";

interface TextFieldProps {
  className?: string;
  variant?: "filled";
  label?: string;
  helpText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
export const TextField: React.FC<TextFieldProps> & {
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
} = ({
  className = "",
  variant,
  label,
  helpText,
  icon,
  children,
}) => (
  <div className={`relative ${className}`}>
    {icon && (
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </span>
    )}
    <div className="w-full">{children}</div>
    {helpText && <span className="text-xs text-gray-500">{helpText}</span>}
  </div>
);

TextField.Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-lg bg-gray-100 pl-10 pr-4 py-2 text-sm border border-gray-200 focus:border-blue-500 outline-none transition placeholder:text-gray-400 ${className}`}
    {...props}
  />
);
