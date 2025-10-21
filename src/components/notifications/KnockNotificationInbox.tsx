import { KnockProvider, KnockFeedProvider, NotificationIconButton, NotificationFeedPopover } from '@knocklabs/react';
import '@knocklabs/react/dist/index.css';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef } from 'react';

export default function KnockNotificationInbox() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const notifButtonRef = useRef(null);
  
  const apiKey = import.meta.env.VITE_KNOCK_PUBLIC_API_KEY;
  const feedId = import.meta.env.VITE_KNOCK_FEED_ID || 'default';

  if (!apiKey || !user?.id) {
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
