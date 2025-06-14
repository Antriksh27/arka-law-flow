
import React from "react";

interface ChatHeaderProps {
  name: string;
  subtitle: string;
  buttons?: React.ReactNode;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  subtitle,
  buttons,
}) => {
  return (
    <div className="flex w-full items-center border-b border-gray-100 px-6 py-6 gap-4">
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-lg font-semibold text-gray-900 truncate">
          {name}
        </span>
        <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
      </div>
      <div className="flex items-center gap-2">{buttons}</div>
    </div>
  );
};
