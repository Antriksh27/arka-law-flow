import { useEffect, useState } from "react";
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationInbox({ userId }) {
  const { user } = useAuth();
  const [subscriberId, setSubscriberId] = useState(userId || null);

  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;
  const backendUrl = import.meta.env.VITE_NOVU_BACKEND_URL;
  const socketUrl = import.meta.env.VITE_NOVU_SOCKET_URL;

  useEffect(() => {
    if (user?.id) {
      setSubscriberId(user.id);
    }
  }, [user]);

  if (!applicationIdentifier || !subscriberId) return null;

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
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
