
import React from 'react';

interface ChatHeaderProps {
  name: string;
  subtitle: string;
  buttons: React.ReactNode;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, subtitle, buttons }) => (
  <div className="flex items-center justify-between w-full p-4 border-b border-gray-200 bg-white flex-shrink-0">
    <div className="flex items-center gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">{buttons}</div>
  </div>
);

export default ChatHeader;
