
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatListProps {
  children: React.ReactNode;
}

interface ChatListItemProps {
  avatar: string;
  name: string;
  message: string;
  timestamp: string;
  selected?: boolean;
  unread?: boolean;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ avatar, name, message, timestamp, selected = false, unread = false }) => (
  <li
    className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors w-full ${
      selected ? 'bg-accent' : 'hover:bg-gray-100'
    }`}
  >
    <Avatar className="h-10 w-10 flex-shrink-0">
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center">
        <p className={`font-semibold text-sm truncate ${selected ? 'text-accent-foreground' : 'text-gray-900'}`}>{name}</p>
        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{timestamp}</p>
      </div>
      <div className="flex justify-between items-center mt-1">
        <p className="text-sm text-gray-600 truncate">{message}</p>
        {unread && (
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-2" />
        )}
      </div>
    </div>
  </li>
);

const ChatList: React.FC<ChatListProps> & { ChatListItem: React.FC<ChatListItemProps> } = ({ children }) => {
  return <ul className="w-full space-y-1">{children}</ul>;
};
ChatList.ChatListItem = ChatListItem;

export default ChatList;
