import { useEffect, useState } from 'react';
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function NovuNotificationInbox() {
  const { user } = useAuth();
  const [isSubscriberReady, setIsSubscriberReady] = useState(false);

  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;

  useEffect(() => {
    if (!user?.id) return;

    const registerSubscriber = async () => {
      try {
        console.log('Registering Novu subscriber:', user.id);
        
        const { data, error } = await supabase.functions.invoke('notify-novu', {
          body: {
            action: 'register_subscriber',
            subscriberId: user.id,
            email: user.email,
            firstName: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0],
            lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          }
        });

        if (error) {
          console.error('Error registering subscriber:', error);
        } else {
          console.log('Subscriber registered successfully:', data);
          setIsSubscriberReady(true);
        }
      } catch (err) {
        console.error('Failed to register subscriber:', err);
      }
    };

    registerSubscriber();
  }, [user?.id, user?.email, user?.user_metadata]);

  if (!applicationIdentifier || !user?.id || !isSubscriberReady) {
    return null;
  }

  return (
    <div className="relative z-50">
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriberId={user.id}
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
