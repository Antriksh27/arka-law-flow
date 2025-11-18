import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Bell, Settings, History, Mail } from 'lucide-react';
import { NotificationSettingsPanel } from './NotificationSettingsPanel';
import { NotificationInbox } from './NotificationInbox';

export const NotificationDashboard = () => {
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage your notifications and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="inbox" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="digest" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Digest</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <NotificationInbox />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <NotificationSettingsPanel />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Notification History</h3>
              <p className="text-sm text-muted-foreground">
                View archived and dismissed notifications
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="digest" className="space-y-4">
          <Card className="p-6">
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Email Digest</h3>
              <p className="text-sm text-muted-foreground">
                Preview and manage your email digest settings
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationDashboard;
