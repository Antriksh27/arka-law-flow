import { KnockProvider, KnockFeedProvider, NotificationIconButton, NotificationFeedPopover } from '@knocklabs/react';
import '@knocklabs/react/dist/index.css';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function KnockNotificationInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Handle notification click and navigate to relevant page
  const handleNotificationClick = (notification: any) => {
    const data = notification.data;
    
    // Close the popover
    setIsVisible(false);

    // Navigate based on module type
    if (data?.module === 'cases' && data?.caseId) {
      navigate(`/cases/${data.caseId}`);
    } else if (data?.module === 'clients' && data?.clientId) {
      navigate(`/client-info?id=${data.clientId}`);
    } else if (data?.module === 'appointments' && data?.appointmentId) {
      navigate(`/appointments?id=${data.appointmentId}`);
    } else if (data?.module === 'tasks' && data?.taskId) {
      navigate(`/tasks?id=${data.taskId}`);
    } else if (data?.module === 'documents' && data?.documentId) {
      navigate(`/documents?id=${data.documentId}`);
    } else if (data?.module === 'hearings' && data?.hearingId) {
      navigate(`/hearings?id=${data.hearingId}`);
    } else if (data?.module === 'contacts' && data?.contactId) {
      navigate(`/contacts?id=${data.contactId}`);
    } else if (data?.module === 'notes' && data?.caseId) {
      navigate(`/cases/${data.caseId}`);
    }
  };

  return (
    <KnockProvider apiKey={apiKey} userId={user.id}>
      <KnockFeedProvider feedId={feedId}>
        <div className="relative">
          <div className="bg-gray-50 hover:bg-gray-200 text-gray-900 rounded-lg h-10 w-10 flex items-center justify-center transition-colors [&_svg]:w-4 [&_svg]:h-4">
            <NotificationIconButton
              ref={notifButtonRef}
              onClick={() => setIsVisible(!isVisible)}
            />
          </div>
          <NotificationFeedPopover
            buttonRef={notifButtonRef}
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
            onNotificationClick={handleNotificationClick}
          />
        </div>
      </KnockFeedProvider>
    </KnockProvider>
  );
}
