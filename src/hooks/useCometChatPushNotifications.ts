import { useEffect, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChat } from './useCometChat';
import { useLocation } from 'react-router-dom';
import { BrowserNotifications } from '@/lib/browserNotifications';
import { useToast } from './use-toast';

/**
 * Global hook for CometChat push notifications
 * Shows browser notifications and toasts when new messages arrive
 * and the user is NOT on the chat page
 */
export const useCometChatPushNotifications = () => {
  const { isCometChatReady } = useCometChat();
  const location = useLocation();
  const { toast } = useToast();
  const listenerIdRef = useRef<string>('global_push_notification_listener');

  // Check if user is currently on a chat-related page
  const isOnChatPage = () => {
    const chatPaths = ['/chat', '/messages'];
    const currentPath = location.pathname;
    
    // Check direct chat paths
    if (chatPaths.some(path => currentPath.startsWith(path))) {
      return true;
    }
    
    // Check if on case page with chat tab open
    if (currentPath.startsWith('/cases/') && location.search.includes('tab=chat')) {
      return true;
    }
    
    return false;
  };

  // Show notification for incoming message
  const showMessageNotification = async (message: CometChat.BaseMessage) => {
    // Don't show if user is on chat page
    if (isOnChatPage()) {
      console.log('📱 User on chat page, skipping push notification');
      return;
    }

    const sender = message.getSender();
    const senderName = sender?.getName() || 'Someone';
    
    // Get message text safely
    let messageText = 'New message';
    if (message instanceof CometChat.TextMessage) {
      messageText = message.getText() || 'New message';
    } else if (message.getType() === 'image') {
      messageText = '📷 Sent an image';
    } else if (message.getType() === 'video') {
      messageText = '🎥 Sent a video';
    } else if (message.getType() === 'audio') {
      messageText = '🎵 Sent an audio message';
    } else if (message.getType() === 'file') {
      messageText = '📎 Sent a file';
    }

    // Truncate long messages
    if (messageText.length > 50) {
      messageText = messageText.substring(0, 47) + '...';
    }

    console.log(`📱 Showing push notification from ${senderName}: ${messageText}`);

    // Show in-app toast
    toast({
      title: senderName,
      description: messageText,
      duration: 5000,
    });

    // Show browser notification if permitted
    try {
      const permission = BrowserNotifications.getPermission();
      
      if (permission === 'granted') {
        await BrowserNotifications.show({
          title: senderName,
          body: messageText,
          icon: '/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png',
          tag: `comet-chat-${message.getId()}`,
          requireInteraction: false,
          data: {
            action_url: '/chat',
          },
        });
      } else if (permission === 'default') {
        // Request permission for next time
        BrowserNotifications.requestPermission();
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  };

  useEffect(() => {
    if (!isCometChatReady) return;

    console.log('📱 Setting up global CometChat push notifications');

    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: (message: CometChat.TextMessage) => {
        console.log('📱 Global listener: Text message received');
        showMessageNotification(message);
      },
      onMediaMessageReceived: (message: CometChat.MediaMessage) => {
        console.log('📱 Global listener: Media message received');
        showMessageNotification(message);
      },
      onCustomMessageReceived: (message: CometChat.CustomMessage) => {
        console.log('📱 Global listener: Custom message received');
        showMessageNotification(message);
      },
    });

    CometChat.addMessageListener(listenerIdRef.current, messageListener);
    console.log('📱 Global CometChat push notification listener registered');

    return () => {
      CometChat.removeMessageListener(listenerIdRef.current);
      console.log('📱 Global CometChat push notification listener removed');
    };
  }, [isCometChatReady, location.pathname, location.search]);

  return null;
};
