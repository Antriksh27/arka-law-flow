import { useEffect } from 'react';
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function NovuNotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier =
    import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER_PROD ||
    import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER_DEV;

  useEffect(() => {
    if (!user?.id) return;

    const initializeNovu = async () => {
      try {
        console.log('🔄 Initializing Novu for user:', user.id);
        
        // Register subscriber (idempotent)
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
          const { data: triggerData, error: triggerError } = await supabase.functions.invoke('notify-novu', {
            body: { action: 'trigger_test', subscriberId: user.id }
          });
          if (triggerError || triggerData?.status === 'error') {
            console.error('❌ Novu test notification failed:', triggerError || triggerData);
          } else {
            console.log('✅ Novu test notification sent:', triggerData);
          }
        }
      } catch (err) {
        console.error('❌ Failed to initialize Novu:', err);
      }
    };

    initializeNovu();
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
            colorPrimary: 'hsl(var(--primary))',
            colorPrimaryForeground: 'hsl(var(--primary-foreground))',
            colorSecondary: 'hsl(var(--secondary))',
            colorSecondaryForeground: 'hsl(var(--secondary-foreground))',
            colorCounter: 'hsl(var(--primary))',
            colorCounterForeground: 'hsl(var(--primary-foreground))',
            colorBackground: 'hsl(var(--background))',
            colorForeground: 'hsl(var(--foreground))',
            colorNeutral: 'hsl(var(--border))',
            fontSize: '14px',
          },
          elements: {
            bellIcon: { color: 'hsl(var(--primary-foreground))' },
            notificationList: { backgroundColor: 'hsl(var(--card))' },
          },
        }}
      />
    </div>
  );
}
