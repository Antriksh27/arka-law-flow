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
    <div className="relative z-50" style={{ opacity: 1 }}>
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriberId={subscriberId}
        {...(backendUrl ? { backendUrl } : {})}
        {...(socketUrl ? { socketUrl } : {})}
        appearance={{
          variables: {
            colorPrimary: 'rgb(37, 99, 235)',
            colorPrimaryForeground: 'rgb(255, 255, 255)',
            colorSecondary: 'rgb(219, 234, 254)',
            colorSecondaryForeground: 'rgb(17, 24, 39)',
            colorCounter: 'rgb(37, 99, 235)',
            colorCounterForeground: 'rgb(255, 255, 255)',
            colorBackground: 'rgb(255, 255, 255)',
            colorForeground: 'rgb(17, 24, 39)',
            colorNeutral: 'rgb(191, 219, 254)',
            fontSize: '14px',
          },
          elements: {
            bellIcon: {
              color: 'rgb(255, 255, 255)',
            },
            notificationList: {
              backgroundColor: 'rgb(255, 255, 255)',
            },
          },
        }}
      />
    </div>
  );
}
