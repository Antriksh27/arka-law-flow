import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { checkSupabaseHealth, HealthCheckResult } from '@/lib/supabaseHealth';

export function ConnectionStatus() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const performHealthCheck = async () => {
    setChecking(true);
    const result = await checkSupabaseHealth();
    setHealth(result);
    setShowAlert(!result.success);
    setChecking(false);
    
    console.log('🏥 Health check result:', result);
  };

  useEffect(() => {
    // Run health check on mount
    performHealthCheck();
    
    // Periodic health check every 30 seconds if there's an error
    const interval = setInterval(() => {
      if (health && !health.success) {
        performHealthCheck();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [health?.success]);

  if (!showAlert || health?.success) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert variant="destructive" className="shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Connection Error</span>
          <WifiOff className="h-4 w-4" />
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="text-sm">
            {!health?.authWorking && (
              <p>• Authentication service is unreachable</p>
            )}
            {!health?.databaseWorking && (
              <p>• Database connection failed</p>
            )}
            {health?.error && (
              <p className="text-xs mt-1 opacity-80">{health.error}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={performHealthCheck}
            disabled={checking}
            className="mt-2"
          >
            {checking ? 'Checking...' : 'Retry Connection'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-2"
          >
            Reload Page
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
