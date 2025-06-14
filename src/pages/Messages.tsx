
import React from 'react';
import { MessageSquare } from 'lucide-react';

const Messages = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-semibold text-gray-800">Messages Module</h1>
        <p className="text-gray-500 mt-2">
          This module is currently under redesign. It will be available soon with a new look and improved features.
        </p>
      </div>
    </div>
  );
};

export default Messages;
