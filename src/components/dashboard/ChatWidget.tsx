import { MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useCometChat } from '@/hooks/useCometChat';

export const ChatWidget = () => {
  const navigate = useNavigate();
  const { isCometChatReady, isInitialized } = useCometChat();

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Team Chat
          </CardTitle>
          <Button variant="link" size="sm" className="text-primary" onClick={() => navigate('/chat')}>
            Open Chat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isInitialized ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !isCometChatReady ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">Chat service initializing...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Team Messages</span>
                <Badge variant="default" className="bg-primary">
                  New
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Chat with your team members in real-time
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/chat')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Conversation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
