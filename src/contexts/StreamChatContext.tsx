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

const STREAM_API_KEY = 'uxgcea9mfdcx';

export const StreamChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let chatClient: StreamChat | null = null;
    let mounted = true;

    const initStreamChat = async () => {
      if (!user) {
        if (client) {
          await client.disconnectUser();
          setClient(null);
          setIsReady(false);
        }
        return;
      }

      // Prevent duplicate initialization
      if (client) {
        console.log('Stream Chat already initialized');
        return;
      }

      try {
        console.log('Initializing Stream Chat for user:', user.id);
        
        // Get Stream token from Supabase function
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No session found');
        }

        const { data, error } = await supabase.functions.invoke('stream-chat-token', {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }

        if (!data || !data.token) {
          console.error('Stream token function returned:', data);
          throw new Error('Token missing from stream-chat-token response');
        }

        console.log('Stream token retrieved successfully');
        const { token, user_name } = data;

        // Initialize Stream Chat client
        chatClient = StreamChat.getInstance(STREAM_API_KEY);
        
        // Connect user
        await chatClient.connectUser(
          {
            id: user.id,
            name: user_name || user.user_metadata?.full_name || user.email || 'User',
            image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user_name || user.email || 'User')}`,
          },
          token
        );

        if (!mounted) return;

        console.log('Stream Chat connected successfully for user:', user.id);
        setClient(chatClient);
        setIsReady(true);

      } catch (error: any) {
        console.error('Failed to initialize Stream Chat:', error);
        
        // Check if it's a WebSocket connection error
        const errorMessage = typeof error === 'object' && error.message 
          ? error.message 
          : JSON.stringify(error);
        
        if (errorMessage.includes('WS connection') || errorMessage.includes('isWSFailure')) {
          toast({
            title: 'Chat Service Unavailable',
            description: 'Unable to connect to chat servers. Please verify your Stream Chat configuration.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Chat Connection Failed',
            description: 'Failed to connect to chat service',
            variant: 'destructive',
          });
        }
        setIsReady(false);
      }
    };

    initStreamChat();

    return () => {
      mounted = false;
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
