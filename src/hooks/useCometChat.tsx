import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { initCometChat, loginCometChatUser, logoutCometChat, CometChatUIKit } from '@/lib/cometchat';
import { useAuth } from '@/contexts/AuthContext';

export const useCometChat = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCometChatReady, setIsCometChatReady] = useState(false);
  const [cometChatUser, setCometChatUser] = useState<CometChat.User | null>(null);

  // Initialize CometChat once
  useEffect(() => {
    const initialize = async () => {
      const success = await initCometChat();
      setIsInitialized(success);
    };

    initialize();
  }, []);

  // Login to CometChat when Supabase user is available
  useEffect(() => {
    const loginUser = async () => {
      if (!isInitialized || !user) {
        setIsCometChatReady(false);
        setCometChatUser(null);
        return;
      }

      try {
        // Get user's full name from metadata or email
        const userName = user.user_metadata?.full_name || user.email || 'Unknown User';
        const loggedInUser = await loginCometChatUser(user.id, userName);
        setCometChatUser(loggedInUser);
        setIsCometChatReady(true);
        console.log('CometChat user logged in:', loggedInUser);
      } catch (error) {
        console.error('Failed to login to CometChat:', error);
        setIsCometChatReady(false);
      }
    };

    loginUser();

    // Cleanup: logout when user changes (only if currently logged in)
    return () => {
      if (user && cometChatUser) {
        CometChatUIKit.getLoggedinUser().then((loggedInUser) => {
          if (loggedInUser) {
            logoutCometChat();
          }
        }).catch(() => {
          // User not logged in, no need to logout
        });
      }
    };
  }, [isInitialized, user]);

  return {
    isInitialized,
    isCometChatReady,
    cometChatUser
  };
};
