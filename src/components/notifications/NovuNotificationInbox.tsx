import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";

export default function NovuNotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER_DEV;

  if (!applicationIdentifier || !user?.id) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id}
      appearance={{
        variables: {
          colorPrimary: '#2563EB',
          colorPrimaryForeground: '#FFFFFF',
          colorSecondary: '#DBEAFE',
          colorSecondaryForeground: '#111827',
          colorCounter: '#2563EB',
          colorCounterForeground: '#FFFFFF',
          colorBackground: '#FFFFFF',
          colorForeground: '#111827',
          colorNeutral: '#BFDBFE',
          fontSize: '14px',
        },
        elements: {
          bellIcon: {
            color: '#FFFFFF',
          },
        },
      }}
    />
  );
}
