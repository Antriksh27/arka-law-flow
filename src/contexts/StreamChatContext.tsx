import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StreamChatContextType {
  client: StreamChat | null;
  isReady: boolean;
}

const StreamChatContext = createContext<StreamChatContextType>({
  client: null,
  isReady: false,
});

export const useStreamChat = () => useContext(StreamChatContext);

const STREAM_API_KEY = 'fvtnet5pupyf';

export const StreamChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let chatClient: StreamChat | null = null;

    const initStreamChat = async () => {
      if (!user) {
        if (client) {
          await client.disconnectUser();
          setClient(null);
          setIsReady(false);
        }
        return;
      }

      try {
        console.log('Initializing Stream Chat for user:', user.id);
        
        // Get Stream token from Supabase function
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No session found');
        }

        const response = await supabase.functions.invoke('stream-chat-token', {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

        if (response.error) {
          throw response.error;
        }

        const { token, user_name } = response.data;

        // Initialize Stream Chat client
        chatClient = StreamChat.getInstance(STREAM_API_KEY);
        
        // Connect user
        await chatClient.connectUser(
          {
            id: user.id,
            name: user_name,
            image: `https://api.dicebear.com/7.x/initials/svg?seed=${user_name}`,
          },
          token
        );

        console.log('Stream Chat connected successfully');
        setClient(chatClient);
        setIsReady(true);

      } catch (error: any) {
        console.error('Failed to initialize Stream Chat:', error);
        toast({
          title: 'Chat Connection Failed',
          description: error.message || 'Failed to connect to chat service',
          variant: 'destructive',
        });
        setIsReady(false);
      }
    };

    initStreamChat();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
    };
  }, [user]);

  return (
    <StreamChatContext.Provider value={{ client, isReady }}>
      {children}
    </StreamChatContext.Provider>
  );
};
