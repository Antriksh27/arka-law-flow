import { MessageSquare, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Chat {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: boolean;
  avatar?: string;
}

interface RecentChatsProps {
  chats: Chat[];
  isLoading?: boolean;
}

export const RecentChats = ({ chats, isLoading }: RecentChatsProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h2 className="text-xl font-semibold">Recent Chats</h2>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h2 className="text-xl font-semibold">Recent Chats</h2>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          Open Full Chat <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {chats.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No recent chats</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.slice(0, 2).map((chat) => (
            <Card
              key={chat.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate('/chat')}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(chat.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.message}
                  </p>
                </div>
                {chat.unread && (
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
