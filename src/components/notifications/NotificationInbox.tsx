import { Inbox } from '@novu/react';
import { useAuth } from '@/contexts/AuthContext';

function NotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = import.meta.env.REACT_APP_NOVU_APPLICATION_IDENTIFIER;
  
  if (!applicationIdentifier) {
    console.error('REACT_APP_NOVU_APPLICATION_IDENTIFIER is not defined');
    return null;
  }

  if (!user?.id) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id}
      appearance={{
        variables: {
          colorPrimary: 'hsl(221, 83%, 53%)',
          colorPrimaryForeground: 'hsl(0, 0%, 100%)',
          colorSecondary: 'hsl(211, 100%, 93%)',
          colorSecondaryForeground: 'hsl(222, 47%, 11%)',
          colorCounter: 'hsl(221, 83%, 53%)',
          colorCounterForeground: 'hsl(0, 0%, 100%)',
          colorBackground: 'hsl(0, 0%, 100%)',
          colorForeground: 'hsl(222, 47%, 11%)',
          colorNeutral: 'hsl(220, 13%, 91%)',
          fontSize: '14px',
        },
        elements: {
          bellIcon: {
            color: 'hsl(222, 47%, 11%)',
          },
        },
      }}
    />
  );
}

export default NotificationInbox;
