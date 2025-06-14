
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
    {label && <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5">
          {icon}
        </span>
      )}
      {children}
    </div>
    {helpText && <span className="text-xs text-gray-500 mt-1">{helpText}</span>}
  </div>
);

TextField.Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-lg bg-gray-100 pl-10 pr-4 py-2 text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-500 ${className}`}
    {...props}
  />
);
