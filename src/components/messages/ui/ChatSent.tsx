import React from 'react';
import { MessageReactions } from '@/components/messages/MessageReactions';
import { MessageAttachment } from '@/components/messages/MessageAttachment';
import { ReactionPicker } from '@/components/messages/ReactionPicker';
import { type MessageReaction, type FileAttachment } from '@/hooks/use-messages';

interface ChatSentProps {
  name: string;
  message: string;
  timestamp: string;
  attachments?: FileAttachment[];
  reactions?: MessageReaction[];
  onReactionAdd?: (emoji: string) => void;
  onReactionClick?: (emoji: string) => void;
}

const ChatSent: React.FC<ChatSentProps> = ({ 
  name, 
  message, 
  timestamp,
  attachments,
  reactions,
  onReactionAdd,
  onReactionClick,
}) => (
  <div className="flex flex-col items-end w-full self-end group">
    <div className="max-w-lg">
      {attachments && attachments.length > 0 && (
        <div className="space-y-2 mb-2">
          {attachments.map((attachment) => (
            <MessageAttachment key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        {onReactionAdd && (
          <ReactionPicker onEmojiSelect={onReactionAdd} />
        )}
        <div className="bg-blue-50 text-slate-900 p-3 rounded-lg rounded-br-none shadow-sm">
          <p className="text-sm">{message}</p>
        </div>
      </div>
      {reactions && reactions.length > 0 && onReactionClick && (
        <MessageReactions reactions={reactions} onReactionClick={onReactionClick} />
      )}
      <p className="text-xs text-slate-500 mt-1 text-right pr-1">{timestamp}</p>
    </div>
  </div>
);

export default ChatSent;
