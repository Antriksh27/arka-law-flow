import { KnockProvider, KnockFeedProvider, NotificationIconButton, NotificationFeedPopover } from '@knocklabs/react';
import '@knocklabs/react/dist/index.css';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import Knock from '@knocklabs/client';

export default function KnockNotificationInbox() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const notifButtonRef = useRef(null);
  
  const apiKey = import.meta.env.VITE_KNOCK_PUBLIC_API_KEY;
  const feedId = import.meta.env.VITE_KNOCK_FEED_ID || 'default';

  useEffect(() => {
    if (apiKey && user?.id) {
      const knockClient = new Knock(apiKey);
      knockClient.authenticate(user.id);
      console.log('🔔 Knock user authenticated:', {
        userId: user.id,
        email: user.email,
        feedId,
        apiKeyPrefix: apiKey.substring(0, 10)
      });
    }
  }, [apiKey, user?.id, user?.email, feedId]);

  if (!apiKey) {
    console.error('❌ VITE_KNOCK_PUBLIC_API_KEY not configured');
    return null;
  }

  if (!user?.id) {
    console.warn('⚠️ No user ID available for Knock');
    return null;
  }

  return (
    <KnockProvider apiKey={apiKey} userId={user.id}>
      <KnockFeedProvider feedId={feedId}>
        <div className="relative">
          <NotificationIconButton
            ref={notifButtonRef}
            onClick={() => setIsVisible(!isVisible)}
          />
          <NotificationFeedPopover
            buttonRef={notifButtonRef}
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
          />
        </div>
      </KnockFeedProvider>
    </KnockProvider>
  );
}
