import { useEffect, useState } from "react";
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationInbox({ userId }) {
  const { user } = useAuth();
  const [subscriberId, setSubscriberId] = useState(userId || null);

  const applicationIdentifier = import.meta.env.REACT_APP_NOVU_APPLICATION_IDENTIFIER;
  const backendUrl = import.meta.env.REACT_APP_NOVU_BACKEND_URL;
  const socketUrl = import.meta.env.REACT_APP_NOVU_SOCKET_URL;

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
      backendUrl={backendUrl}
      socketUrl={socketUrl}
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
