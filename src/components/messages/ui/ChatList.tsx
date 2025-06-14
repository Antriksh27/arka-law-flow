
import React from "react";

interface ChatListProps {
  children: React.ReactNode;
}

export function ChatList({ children }: ChatListProps) {
  return <div className="flex flex-col w-full">{children}</div>;
}

interface ChatListItemProps {
  avatar: string;
  name: string;
  message: string;
  timestamp: string;
  selected?: boolean;
  unread?: boolean;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  avatar,
  name,
  message,
  timestamp,
  selected,
  unread,
}) => {
  return (
    <div
      className={`flex w-full items-center gap-3 rounded-xl cursor-pointer px-2 py-3 hover:bg-blue-100 transition ${
        selected ? "bg-blue-100 font-semibold" : ""
      }`}
    >
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-gray-200"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm">{name}</span>
          <span
            className={`text-xs ${unread ? "font-bold text-primary" : "text-muted-foreground"}`}
          >
            {timestamp}
          </span>
        </div>
        <div
          className={`truncate text-xs ${
            unread ? "font-bold text-primary" : "text-muted-foreground"
          }`}
        >
          {message}
        </div>
      </div>
      {unread && (
        <span className="ml-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </div>
  );
};

ChatList.ChatListItem = ChatListItem;
