import { Inbox } from '@novu/react';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;

  if (!applicationIdentifier || !user?.id) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id}
      appearance={{
        variables: {
          colorPrimary: 'hsl(37 99% 53%)',
          colorPrimaryForeground: 'hsl(0 0% 100%)',
          colorSecondary: 'hsl(213 97% 93%)',
          colorSecondaryForeground: 'hsl(222 47% 11%)',
          colorCounter: 'hsl(37 99% 53%)',
          colorCounterForeground: 'hsl(0 0% 100%)',
          colorBackground: 'hsl(0 0% 100%)',
          colorForeground: 'hsl(222 47% 11%)',
          colorNeutral: 'hsl(213 97% 87%)',
          fontSize: '14px',
        },
        elements: {
          bellIcon: {
            color: 'hsl(0 0% 100%)',
          },
        },
      }}
    />
  );
}
