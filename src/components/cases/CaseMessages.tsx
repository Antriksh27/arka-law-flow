
import React from 'react';
import { MessageSquare } from 'lucide-react';

interface CaseMessagesProps {
  caseId: string;
}

export const CaseMessages: React.FC<CaseMessagesProps> = ({
  caseId
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Messages</h3>
      </div>
      <div className="border border-gray-200 rounded-lg h-96 flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="font-semibold">Messages Redesign in Progress</p>
        <p className="text-sm">This module is currently being overhauled and will be back soon.</p>
      </div>
    </div>
  );
};
