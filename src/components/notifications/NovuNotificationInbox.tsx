import { useEffect, useState } from 'react';
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function NovuNotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;
  const [subscriberHash, setSubscriberHash] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const initializeNovu = async () => {
      try {
        console.log('🔄 Initializing Novu for user:', user.id);
        
        // 1. Register subscriber (idempotent)
        const { data: registerData, error: registerError } = await supabase.functions.invoke('notify-novu', {
          body: {
            action: 'register_subscriber',
            subscriberId: user.id,
            email: user.email,
            firstName: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0],
            lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          }
        });

        if (registerError || registerData?.status === 'error') {
          console.error('❌ Novu subscriber registration failed:', registerError || registerData);
        } else {
          console.log('✅ Novu subscriber registered:', registerData);
        }

        // 2. Get subscriber hash for authenticated Inbox
        const { data: hashData, error: hashError } = await supabase.functions.invoke('notify-novu', {
          body: {
            action: 'get_subscriber_hash',
            subscriberId: user.id,
          }
        });

        if (hashError || hashData?.status === 'error') {
          console.error('❌ Failed to get subscriber hash:', hashError || hashData);
        } else if (hashData?.subscriberHash) {
          console.log('✅ Subscriber hash obtained for:', user.id);
          setSubscriberHash(hashData.subscriberHash);
        }
      } catch (err) {
        console.error('❌ Failed to initialize Novu:', err);
      }
    };

    initializeNovu();
  }, [user?.id, user?.email, user?.user_metadata]);

  if (!applicationIdentifier || !user?.id || !subscriberHash) {
    return null;
  }

  return (
    <div className="relative z-50">
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriberId={user.id}
        subscriberHash={subscriberHash}
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
