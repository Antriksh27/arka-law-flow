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

  if (!apiKey) {
    console.error('❌ VITE_KNOCK_PUBLIC_API_KEY not configured');
    return null;
  }

  if (!user?.id) {
    console.warn('⚠️ No user ID available for Knock');
    return null;
  }

  if (!feedId || feedId === 'default') {
    console.warn('⚠️ Knock feed ID looks like a placeholder ("default"). Please set VITE_KNOCK_FEED_ID to your In-app feed channel ID.');
  }

  return (
    <KnockProvider apiKey={apiKey} userId={user.id}>
      <KnockFeedProvider feedId={feedId}>
        <div className="relative">
          <div className="bg-gray-50 hover:bg-gray-200 text-gray-900 rounded-lg p-2 transition-colors [&_svg]:w-4 [&_svg]:h-4">
            <NotificationIconButton
              ref={notifButtonRef}
              onClick={() => setIsVisible(!isVisible)}
            />
          </div>
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
