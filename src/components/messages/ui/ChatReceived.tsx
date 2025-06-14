
import React from "react";

interface ChatReceivedProps {
  avatar: string;
  initials: string;
  name: string;
  message: string;
  time: string;
}

export const ChatReceived: React.FC<ChatReceivedProps> = ({
  avatar,
  initials,
  name,
  message,
  time,
}) => (
  <div className="flex w-full gap-3 items-end">
    <img
      src={avatar}
      alt={name}
      className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
    />
    <div>
      <div className="text-sm font-bold text-primary truncate">{name}</div>
      <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-900 shadow-sm mt-1">
        {message}
      </div>
      <div className="text-xs text-muted-foreground text-left mt-1">{time}</div>
    </div>
  </div>
);
