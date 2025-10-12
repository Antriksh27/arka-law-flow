import { Inbox } from '@novu/react';
import { useAuth } from '@/contexts/AuthContext';

function NotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = import.meta.env.REACT_APP_NOVU_APPLICATION_IDENTIFIER || import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;
  const backendUrl = import.meta.env.REACT_APP_NOVU_BACKEND_URL || import.meta.env.VITE_NOVU_BACKEND_URL;
  const socketUrl = import.meta.env.REACT_APP_NOVU_SOCKET_URL || import.meta.env.VITE_NOVU_SOCKET_URL;

  if (!applicationIdentifier) {
    console.error('Novu application identifier is not defined');
    return null;
  }

  if (!user?.id) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id}
      {...(backendUrl ? { backendUrl } : {})}
      {...(socketUrl ? { socketUrl } : {})}
      appearance={{
        variables: {
          colorPrimary: 'rgb(var(--primary))',
          colorPrimaryForeground: 'rgb(var(--primary-foreground))',
          colorSecondary: 'rgb(var(--secondary))',
          colorSecondaryForeground: 'rgb(var(--secondary-foreground))',
          colorCounter: 'rgb(var(--primary))',
          colorCounterForeground: 'rgb(var(--primary-foreground))',
          colorBackground: 'rgb(var(--card))',
          colorForeground: 'rgb(var(--foreground))',
          colorNeutral: 'rgb(var(--border))',
          fontSize: '14px',
        },
        elements: {
          bellIcon: {
            color: 'rgb(var(--foreground))',
          },
        },
      }}
    />
  );
}

export default NotificationInbox;
