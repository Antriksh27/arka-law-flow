
import React from "react";

interface ChatSentProps {
  name: string;
  message: string;
  timestamp: string;
}

export const ChatSent: React.FC<ChatSentProps> = ({
  name,
  message,
  timestamp,
}) => (
  <div className="flex w-full justify-end gap-3 items-end">
    <div>
      <div className="text-sm font-bold text-right text-primary truncate">{name}</div>
      <div className="rounded-xl bg-blue-700 px-4 py-2 text-sm text-white shadow-sm mt-1">
        {message}
      </div>
      <div className="text-xs text-muted-foreground text-right mt-1">{timestamp}</div>
    </div>
  </div>
);
