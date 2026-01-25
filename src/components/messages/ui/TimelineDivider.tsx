import React from 'react';

interface TimelineDividerProps {
  children: React.ReactNode;
}

const TimelineDivider: React.FC<TimelineDividerProps> = ({ children }) => (
  <div className="relative w-full my-4">
    <div className="absolute inset-0 flex items-center" aria-hidden="true">
      <div className="w-full border-t border-slate-200" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-slate-50 px-3 text-sm font-medium text-slate-500">{children}</span>
    </div>
  </div>
);

export default TimelineDivider;
