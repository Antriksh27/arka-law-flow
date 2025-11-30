import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { checkSupabaseHealth, HealthCheckResult } from '@/lib/supabaseHealth';

export function ConnectionStatus() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [failureCount, setFailureCount] = useState(0);

  const performHealthCheck = async () => {
    setChecking(true);
    const result = await checkSupabaseHealth();
    setHealth(result);
    
    // Only show alert after 2 consecutive failures
    if (!result.success) {
      setFailureCount(prev => prev + 1);
      if (failureCount >= 1) {
        setShowAlert(true);
      }
    } else {
      setFailureCount(0);
      setShowAlert(false);
    }
    
    setChecking(false);
    console.log('🏥 Health check result:', result);
  };

  useEffect(() => {
    // Delay initial health check by 3 seconds to let auth settle
    const initialDelay = setTimeout(() => {
      performHealthCheck();
    }, 3000);
    
    // Periodic health check every 30 seconds if there's an error
    const interval = setInterval(() => {
      if (health && !health.success) {
        performHealthCheck();
      }
    }, 30000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [health?.success]);

  if (!showAlert || health?.success) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert variant="destructive" className="shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Connection Issue</span>
          <WifiOff className="h-4 w-4" />
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="text-sm">
            <p className="mb-2">Having trouble connecting to the server. This may be due to slow network.</p>
            {!health?.authWorking && (
              <p>• Authentication service is slow</p>
            )}
            {!health?.databaseWorking && (
              <p>• Database queries are slow</p>
            )}
            {health?.error && (
              <p className="text-xs mt-1 opacity-80">{health.error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={performHealthCheck}
              disabled={checking}
            >
              {checking ? 'Checking...' : 'Retry'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlert(false)}
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
