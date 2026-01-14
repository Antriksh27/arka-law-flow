import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Loader2, CheckCircle, XCircle, Zap, Moon, Mail, Layers } from 'lucide-react';
import { useTestNotification, TestNotificationType } from '@/hooks/useTestNotification';

const testTypes: { value: TestNotificationType; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'basic', 
    label: 'Basic Test', 
    description: 'A simple notification to verify the system works',
    icon: <Bell className="w-4 h-4" />
  },
  { 
    value: 'urgent', 
    label: 'Urgent Priority', 
    description: 'Test urgent priority notification styling',
    icon: <Zap className="w-4 h-4 text-red-500" />
  },
  { 
    value: 'quiet_hours', 
    label: 'Quiet Hours', 
    description: 'Test notification queuing during quiet hours',
    icon: <Moon className="w-4 h-4 text-purple-500" />
  },
  { 
    value: 'digest', 
    label: 'Digest Batch', 
    description: 'Test notification batching for email digest',
    icon: <Mail className="w-4 h-4 text-blue-500" />
  },
  { 
    value: 'all_categories', 
    label: 'All Categories', 
    description: 'Send test notifications for all categories',
    icon: <Layers className="w-4 h-4 text-green-500" />
  },
];

export const NotificationTestPanel = () => {
  const { sendTestNotification, isSending } = useTestNotification();
  const [selectedType, setSelectedType] = useState<TestNotificationType>('basic');
  const [lastResult, setLastResult] = useState<{ success: boolean; message?: string } | null>(null);

  const handleSendTest = async () => {
    const result = await sendTestNotification(selectedType);
    setLastResult(result);
  };

  const selectedTestType = testTypes.find(t => t.value === selectedType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-primary" />
          Test Notification System
        </CardTitle>
        <CardDescription>
          Send test notifications to verify your notification settings are working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Test Type</label>
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as TestNotificationType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              {testTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {type.icon}
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTestType && (
            <p className="text-xs text-muted-foreground">{selectedTestType.description}</p>
          )}
        </div>

        <Button 
          onClick={handleSendTest} 
          disabled={isSending}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Send Test Notification
            </>
          )}
        </Button>

        {lastResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            lastResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {lastResult.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="text-sm">
              {lastResult.success ? 'Test sent successfully!' : 'Test failed'}
            </span>
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">System Status</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
              In-App Active
            </Badge>
            <Badge variant="default" className="text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
              Realtime Connected
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5" />
              Email Requires Setup
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTestPanel;
