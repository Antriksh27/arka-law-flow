import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";

export default function NovuNotificationInbox() {
  const { user } = useAuth();

  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;
  const backendUrl = import.meta.env.VITE_NOVU_BACKEND_URL;
  const socketUrl = import.meta.env.VITE_NOVU_SOCKET_URL;

  if (!applicationIdentifier || !user?.id) return null;

  return (
    <div className="relative z-50">
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriberId={user.id}
        {...(backendUrl ? { backendUrl } : {})}
        {...(socketUrl ? { socketUrl } : {})}
        appearance={{
          variables: {
            colorPrimary: 'hsl(37 99% 67%)',
            colorPrimaryForeground: 'hsl(0 0% 100%)',
            colorSecondary: 'hsl(219 100% 93%)',
            colorSecondaryForeground: 'hsl(17 24% 11%)',
            colorCounter: 'hsl(37 99% 67%)',
            colorCounterForeground: 'hsl(0 0% 100%)',
            colorBackground: 'hsl(239 100% 98%)',
            colorForeground: 'hsl(17 24% 11%)',
            colorNeutral: 'hsl(191 100% 88%)',
            fontSize: '14px',
          },
          elements: {
            bellIcon: {
              color: 'hsl(0 0% 100%)',
            },
            notificationList: {
              backgroundColor: 'hsl(0 0% 100%)',
            },
          },
        }}
      />
    </div>
  );
}
