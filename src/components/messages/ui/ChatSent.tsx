
import React from 'react';

interface ChatSentProps {
  name: string;
  message: string;
  timestamp: string;
}

const ChatSent: React.FC<ChatSentProps> = ({ name, message, timestamp }) => (
  <div className="flex flex-col items-end w-full self-end">
    <div className="max-w-lg">
       <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none shadow-sm">
        <p className="text-sm">{message}</p>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right pr-1">{timestamp}</p>
    </div>
  </div>
);

export default ChatSent;
