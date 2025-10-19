import { useState, useEffect } from 'react';
import { Inbox } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestProductionNovu() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>("");
  const prodAppId = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER_PROD;

  useEffect(() => {
    if (user?.id && prodAppId) {
      triggerProductionIntegration();
    }
  }, [user?.id, prodAppId]);

  const triggerProductionIntegration = async () => {
    if (!user?.id) {
      setTestResult("❌ No user logged in");
      return;
    }

    try {
      setTestResult("🔄 Confirming production Novu integration...");
      
      const response = await fetch('https://api.novu.co/v1/subscribers', {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${import.meta.env.VITE_NOVU_API_KEY_PROD || 'b4e8cf49be93c8ae94f86fdbd3d95c38'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId: user.id,
          email: user.email,
          firstName: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setTestResult(`⚠️ Subscriber registration: ${JSON.stringify(error)}`);
      }

      const triggerResponse = await fetch('https://api.novu.co/v1/events/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${import.meta.env.VITE_NOVU_API_KEY_PROD || 'b4e8cf49be93c8ae94f86fdbd3d95c38'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'in-app',
          to: { subscriberId: user.id },
          payload: {
            subject: 'Production Integration Test',
            body: 'Your production Novu inbox is now active! 🎉',
          },
        }),
      });

      if (!triggerResponse.ok) {
        const error = await triggerResponse.json();
        setTestResult(`❌ Failed: ${JSON.stringify(error)}`);
      } else {
        setTestResult("✅ Production integration confirmed! Check your Novu dashboard.");
      }
    } catch (err) {
      setTestResult(`❌ Error: ${err}`);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Production Novu Integration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Confirming production environment connection
        </p>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={triggerProductionIntegration}>
            Confirm Production Integration
          </Button>
        </div>

        {testResult && (
          <div className="p-3 bg-muted rounded-md text-sm">
            {testResult}
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-2">Production Inbox (App ID: {prodAppId || 'not set'}):</p>
        {user?.id && prodAppId ? (
          <div className="relative">
          <Inbox
            applicationIdentifier={prodAppId}
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
                bellIcon: { color: 'hsl(var(--primary))' },
              },
            }}
          />
          </div>
        ) : (
          <div className="p-3 bg-muted rounded-md text-sm">
            Set VITE_NOVU_APPLICATION_IDENTIFIER_PROD to render the production inbox.
          </div>
        )}
      </div>
    </Card>
  );
}
