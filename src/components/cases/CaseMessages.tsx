import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
interface CaseMessagesProps {
  caseId: string;
}
export const CaseMessages: React.FC<CaseMessagesProps> = ({
  caseId
}) => {
  const [newMessage, setNewMessage] = useState('');
  const {
    data: messages,
    isLoading
  } = useQuery({
    queryKey: ['case-messages', caseId],
    queryFn: async () => {
      // For now, return empty array since we need to set up message threads
      return [];
    }
  });
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // TODO: Implement message sending
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Messages</h3>
      </div>

      <div className="border border-gray-200 rounded-lg h-96 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages && messages.length > 0 ? messages.map((message: any) => <div key={message.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gray-100 text-sm">
                    {message.sender?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.sender?.full_name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(message.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{message.message_text}</p>
                </div>
              </div>) : <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No messages yet</p>
                <p className="text-xs">Start a conversation about this case</p>
              </div>
            </div>}
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} className="flex-1" />
            <Button variant="outline" size="icon">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button onClick={handleSendMessage} className="bg-[#79c83f]">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>;
};