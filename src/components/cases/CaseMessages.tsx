
import React from 'react';
import { Paperclip, Send } from 'lucide-react';
import TimelineDivider from '@/components/messages/ui/TimelineDivider';
import ChatReceived from '@/components/messages/ui/ChatReceived';
import ChatSent from '@/components/messages/ui/ChatSent';
import { TextFieldUnstyled } from '@/components/messages/ui/TextFieldUnstyled';
import { IconButton } from '@/components/messages/ui/IconButton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CaseMessagesProps {
  caseId: string;
}

export const CaseMessages: React.FC<CaseMessagesProps> = ({
  caseId
}) => {
  return (
    <div className="border border-gray-200 rounded-lg h-[600px] flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Case Discussion</h3>
        <Button asChild variant="outline">
          <Link to="/messages">
            Open in Messages
          </Link>
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50">
        <TimelineDivider>Yesterday</TimelineDivider>
        <ChatReceived
          avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
          initials="RM"
          name="Rahul Mehta"
          message="Hi, I've reviewed the property documents for this case. There are a few concerns we need to address."
          time="2:30 PM"
        />
        <ChatSent
          name="You"
          message="Could you highlight the specific areas that need attention?"
          timestamp="2:35 PM"
        />
      </div>
      <div className="flex w-full items-center gap-4 border-t border-solid border-gray-200 bg-white px-4 py-3">
        <IconButton
          variant="brand-tertiary"
          icon={<Paperclip className="w-5 h-5" />}
        />
        <TextFieldUnstyled className="h-auto grow shrink-0 basis-0">
          <TextFieldUnstyled.Input
            placeholder="Type your message..."
          />
        </TextFieldUnstyled>
        <IconButton
          variant="brand-primary"
          icon={<Send className="w-5 h-5" />}
        />
      </div>
    </div>
  );
};

