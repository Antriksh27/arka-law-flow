
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatReceivedProps {
  avatar: string;
  initials: string;
  name: string;
  message: string;
  time: string;
}

const ChatReceived: React.FC<ChatReceivedProps> = ({ avatar, initials, name, message, time }) => (
  <div className="flex items-start gap-3 w-full self-start">
    <Avatar className="h-8 w-8 flex-shrink-0">
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col items-start max-w-lg">
      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100">
        <p className="text-sm text-gray-800">{message}</p>
      </div>
      <p className="text-xs text-gray-500 mt-1 pl-1">{time}</p>
    </div>
  </div>
);

export default ChatReceived;
