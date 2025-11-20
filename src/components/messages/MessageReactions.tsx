import React from 'react';
import { MessageReaction } from '@/hooks/use-message-reactions';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReactionClick: (emoji: string) => void;
  className?: string;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReactionClick,
  className,
}) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1 mt-1', className)}>
      {reactions.map((reaction) => (
        <TooltipProvider key={reaction.emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
            <Badge
                variant={reaction.hasUserReacted ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-xs px-2 py-0.5 rounded-full transition-all hover:scale-105',
                  reaction.hasUserReacted && 'bg-primary/20 border-primary'
                )}
                onClick={() => onReactionClick(reaction.emoji)}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {reaction.users.map((u) => u.name).join(', ')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};
