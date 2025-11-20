import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageReactions } from '@/components/messages/MessageReactions';
import { MessageAttachment } from '@/components/messages/MessageAttachment';
import { ReactionPicker } from '@/components/messages/ReactionPicker';
import { type MessageReaction, type FileAttachment } from '@/hooks/use-messages';

interface ChatReceivedProps {
  avatar: string;
  initials: string;
  name: string;
  message: string;
  time: string;
  attachments?: FileAttachment[];
  reactions?: MessageReaction[];
  onReactionAdd?: (emoji: string) => void;
  onReactionClick?: (emoji: string) => void;
}

const ChatReceived: React.FC<ChatReceivedProps> = ({ 
  avatar, 
  initials, 
  name, 
  message, 
  time,
  attachments,
  reactions,
  onReactionAdd,
  onReactionClick,
}) => (
  <div className="flex items-start gap-3 w-full self-start group">
    <Avatar className="h-8 w-8 flex-shrink-0">
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col items-start max-w-lg">
      {attachments && attachments.length > 0 && (
        <div className="space-y-2 mb-2">
          {attachments.map((attachment) => (
            <MessageAttachment key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100">
          <p className="text-sm text-gray-800">{message}</p>
        </div>
        {onReactionAdd && (
          <ReactionPicker onEmojiSelect={onReactionAdd} />
        )}
      </div>
      {reactions && reactions.length > 0 && onReactionClick && (
        <MessageReactions reactions={reactions} onReactionClick={onReactionClick} />
      )}
      <p className="text-xs text-gray-500 mt-1 pl-1">{time}</p>
    </div>
  </div>
);

export default ChatReceived;
