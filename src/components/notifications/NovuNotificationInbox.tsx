import { useEffect } from 'react';
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function NovuNotificationInbox() {
  const { user } = useAuth();
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

        if (error || data?.status === 'error') {
          console.error('❌ Novu subscriber registration failed:', error || data);
        } else {
          console.log('✅ Novu subscriber registered successfully:', data);
        }
      } catch (err) {
        console.error('❌ Failed to register Novu subscriber:', err);
      }
    };

    registerSubscriber();
  }, [user?.id, user?.email, user?.user_metadata]);

  if (!applicationIdentifier || !user?.id) {
    return null;
  }

  return (
    <div className="relative z-50">
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriberId={user.id}
        appearance={{
          variables: {
            colorPrimary: '#1E3A8A',
            colorPrimaryForeground: '#FFFFFF',
            colorSecondary: '#E0E7FF',
            colorSecondaryForeground: '#111827',
            colorCounter: '#1E3A8A',
            colorCounterForeground: '#FFFFFF',
            colorBackground: '#F9FAFB',
            colorForeground: '#111827',
            colorNeutral: '#E5E7EB',
            fontSize: '14px',
          },
          elements: {
            bellIcon: {
              color: '#FFFFFF',
            },
            notificationList: {
              backgroundColor: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
}
