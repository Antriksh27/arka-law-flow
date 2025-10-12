import { useEffect, useState } from "react";
import { NovuProvider, PopoverNotificationCenter, NotificationBell } from "@novu/react";
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
    <NovuProvider
      subscriberId={subscriberId}
      applicationIdentifier={applicationIdentifier}
      backendUrl={backendUrl}
      socketUrl={socketUrl}
      theme="light"
    >
      <PopoverNotificationCenter colorScheme="light">
        {({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
      </PopoverNotificationCenter>
    </NovuProvider>
  );
}
