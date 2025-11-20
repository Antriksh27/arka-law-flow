import React, { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface ReactionPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onEmojiSelect,
}) => {
  const [open, setOpen] = useState(false);

  const handleQuickReaction = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform"
                onClick={() => handleQuickReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
          <div className="border-t pt-2">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={300}
              height={350}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
