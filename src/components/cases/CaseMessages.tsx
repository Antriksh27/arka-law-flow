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
  // TODO: This component needs to be updated to use the new messaging hooks.
  // It should fetch the message thread associated with `caseId`, or create one if it doesn't exist.
  // It will then use the ChatView component or a similar implementation to display and send messages.
  return (
    <div className="border border-gray-200 rounded-lg h-[600px] flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-semibold">Case Discussion</h3>
        <Button asChild variant="outline">
          <Link to="/messages">
            Open in Messages
          </Link>
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-soft">
        <div className="text-center text-muted p-8">
            <p>Case messaging is being upgraded.</p>
            <p>Please use the main Messages page for now.</p>
        </div>
      </div>
      <div className="flex w-full items-center gap-4 border-t border-solid border-gray-200 bg-white px-4 py-3 opacity-50 pointer-events-none">
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
