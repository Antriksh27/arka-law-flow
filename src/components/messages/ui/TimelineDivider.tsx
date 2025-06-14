
import React from "react";

export const TimelineDivider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex items-center w-full py-3">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="px-3 text-xs text-gray-500 font-semibold">{children}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);
