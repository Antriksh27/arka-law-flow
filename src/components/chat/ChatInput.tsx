import React, { useState } from 'react';
import { CometChat } from '@/lib/cometchat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  selectedUser: CometChat.User;
  onMessageSent?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ selectedUser, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  const handleTyping = (value: string) => {
    setMessage(value);

    // Send typing indicator
    if (value.length > 0 && !isTyping) {
      const typingNotification = new CometChat.TypingIndicator(
        selectedUser.getUid(),
        'user'
      );
      CometChat.startTyping(typingNotification);
      setIsTyping(true);
    } else if (value.length === 0 && isTyping) {
      const typingNotification = new CometChat.TypingIndicator(
        selectedUser.getUid(),
        'user'
      );
      CometChat.endTyping(typingNotification);
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);

    // End typing indicator
    if (isTyping) {
      const typingNotification = new CometChat.TypingIndicator(
        selectedUser.getUid(),
        'user'
      );
      CometChat.endTyping(typingNotification);
      setIsTyping(false);
    }

    const textMessage = new CometChat.TextMessage(
      selectedUser.getUid(),
      message.trim(),
      'user'
    );

    try {
      await CometChat.sendMessage(textMessage);
      setMessage('');
      onMessageSent?.();
      
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <Textarea
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="min-h-[56px] max-h-32 resize-none rounded-2xl border-input focus:border-primary transition-colors"
          disabled={sending}
        />
      </div>
      <Button
        onClick={sendMessage}
        disabled={!message.trim() || sending}
        size="icon"
        className="h-[56px] w-[56px] rounded-2xl shadow-sm hover:shadow-md transition-all"
      >
        {sending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};
