import { useState } from 'react';
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestProductionNovu() {
  const { user } = useAuth();
  const [showProdInbox, setShowProdInbox] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const testProductionConnection = async () => {
    if (!user?.id) {
      setTestResult("❌ No user logged in");
      return;
    }

    try {
      setTestResult("🔄 Testing production Novu connection...");
      
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
        setTestResult(`❌ Registration failed: ${error?.message || JSON.stringify(data)}`);
      } else {
        setTestResult("✅ Subscriber registered successfully!");
        setShowProdInbox(true);
      }
    } catch (err) {
      setTestResult(`❌ Error: ${err}`);
    }
  };

  const sendTestNotification = async () => {
    if (!user?.id) return;

    try {
      setTestResult("🔄 Sending test notification...");
      
      const { data, error } = await supabase.functions.invoke('notify-novu', {
        body: {
          action: 'trigger_test',
          subscriberId: user.id,
        }
      });

      if (error || data?.status === 'error') {
        setTestResult(`❌ Test notification failed: ${error?.message || JSON.stringify(data)}`);
      } else {
        setTestResult("✅ Test notification sent! Check the inbox below.");
      }
    } catch (err) {
      setTestResult(`❌ Error: ${err}`);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Production Novu Test</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Test the production Novu integration before deploying
        </p>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={testProductionConnection}>
            Test Connection
          </Button>
          <Button onClick={sendTestNotification} variant="outline">
            Send Test Notification
          </Button>
        </div>

        {testResult && (
          <div className="p-3 bg-muted rounded-md text-sm">
            {testResult}
          </div>
        )}
      </div>

      {showProdInbox && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Production Inbox Preview:</p>
          <div className="relative">
            <Inbox
              applicationIdentifier={import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER_PROD}
              subscriberId={user?.id || ""}
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
                    color: '#1E3A8A',
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
