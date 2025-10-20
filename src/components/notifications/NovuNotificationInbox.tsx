import { useEffect } from 'react';
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function NovuNotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER;

  useEffect(() => {
    if (!user?.id || !applicationIdentifier) return;
    const key = `novu-test-sent-${user.id}`;
    if (localStorage.getItem(key)) return;
    (async () => {
      try {
        await supabase.functions.invoke('notify-novu', {
          body: {
            action: 'register_subscriber',
            subscriberId: user.id,
            email: user.email,
            firstName: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0],
            lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          },
        });
        await supabase.functions.invoke('notify-novu', {
          body: { action: 'trigger_test', subscriberId: user.id },
        });
        localStorage.setItem(key, '1');
      } catch (e) {
      }
    })();
  }, [user?.id, user?.email, user?.user_metadata, applicationIdentifier]);

  if (!applicationIdentifier || !user?.id) {
    return null;
  }

  return (
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
        },
      }}
    />
  );
}

