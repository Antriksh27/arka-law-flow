import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ClientOverview } from './ClientOverview';
import { ClientInformation } from './ClientInformation';
import { ClientCases } from './ClientCases';
import { ClientAppointments } from './ClientAppointments';
import { ClientDocuments } from './ClientDocuments';
import { ClientNotes } from './ClientNotes';
import { ClientTasks } from './ClientTasks';
import { ClientEmails } from './ClientEmails';
import { ClientTimeline } from './ClientTimeline';
import { ClientQuickActions } from './ClientQuickActions';
import { EditClientDialog } from './EditClientDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { BarChart3, CheckSquare, Calendar, Briefcase, StickyNote, FileText, Mail, User, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface ClientTabsProps {
  clientId: string;
  client: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdate: () => void;
}
export const ClientTabs: React.FC<ClientTabsProps> = ({
  clientId,
  client,
  activeTab,
  onTabChange,
  onUpdate
}) => {
  const isMobile = useIsMobile();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [portalEnabled, setPortalEnabled] = useState(client.client_portal_enabled ?? false);
  const [isUpdatingPortal, setIsUpdatingPortal] = useState(false);

  const handlePortalToggle = async (enabled: boolean) => {
    setIsUpdatingPortal(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ client_portal_enabled: enabled })
        .eq('id', client.id);

      if (error) throw error;

      setPortalEnabled(enabled);
      toast.success(enabled ? 'Client portal enabled' : 'Client portal disabled');
      onUpdate();
    } catch (error) {
      console.error('Error updating portal access:', error);
      toast.error('Failed to update portal access');
    } finally {
      setIsUpdatingPortal(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'lead':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'prospect':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const tabs = [{
    value: 'overview',
    label: 'Overview',
    icon: BarChart3
  }, {
    value: 'information',
    label: 'Information',
    icon: User
  }, {
    value: 'cases',
    label: 'Cases',
    icon: Briefcase
  }, {
    value: 'appointments',
    label: 'Appointments',
    icon: Calendar
  }, {
    value: 'documents',
    label: 'Documents',
    icon: FileText
  }, {
    value: 'tasks',
    label: 'Tasks',
    icon: CheckSquare
  }, {
    value: 'notes',
    label: 'Notes',
    icon: StickyNote
  }, {
    value: 'emails',
    label: 'Emails',
    icon: Mail
  }, {
    value: 'timeline',
    label: 'Timeline',
    icon: Clock
  }];
  return <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader 
          title={client.full_name}
          showBack={true}
          actions={
            <ClientQuickActions 
              clientId={client.id} 
              clientName={client.full_name} 
              clientEmail={client.email} 
              onAction={onUpdate} 
            />
          }
        />
      )}

      <div className={isMobile ? "" : "bg-white border border-gray-200 rounded-2xl shadow-sm m-8"}>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        {/* Header section - Desktop only */}
        {!isMobile && (
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-medium">
                    {client.full_name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    {client.full_name}
                    {client.is_vip && (
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" aria-label="VIP Client" />
                    )}
                  </h1>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {client.email && <div>
                          <span className="font-medium">Email:</span> {client.email}
                        </div>}
                      {client.phone && <div>
                          <span className="font-medium">Phone:</span> {client.phone}
                        </div>}
                      {client.type && <div>
                          <span className="font-medium">Type:</span> {client.type}
                        </div>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 items-center">
                      {client.organization && <div>
                          <span className="font-medium">Organization:</span> {client.organization}
                        </div>}
                    </div>
                    {(client.referred_by_name || client.source) && <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {client.referred_by_name && <div>
                            <span className="font-medium">Referred By:</span> {client.referred_by_name}
                          </div>}
                        {client.source && <div>
                            <span className="font-medium">Source:</span> {client.source}
                          </div>}
                      </div>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="portal-toggle" className="text-sm text-muted-foreground">
                    Client Portal
                  </Label>
                  <Switch
                    id="portal-toggle"
                    checked={portalEnabled}
                    onCheckedChange={handlePortalToggle}
                    disabled={isUpdatingPortal}
                  />
                </div>
                <ClientQuickActions clientId={client.id} clientName={client.full_name} clientEmail={client.email} onAction={onUpdate} />
              </div>
            </div>
          </div>
        )}


        {/* Tabs List */}
        <TabsList className={`w-full bg-white border-b border-gray-200 h-auto p-0 ${isMobile ? 'sticky top-14 z-30' : ''}`}>
          <div className={`flex ${isMobile ? 'overflow-x-auto scrollbar-hide' : 'flex-wrap sm:flex-nowrap overflow-x-auto'}`}>
            {tabs.map(tab => {
            const IconComponent = tab.icon;
            return <TabsTrigger 
              key={tab.value} 
              value={tab.value} 
              className={`flex items-center gap-2 ${
                isMobile 
                  ? 'px-3 py-2.5 text-xs flex-shrink-0' 
                  : 'px-4 py-3 text-sm'
              } font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>;
          })}
          </div>
        </TabsList>

        {/* Tab Content */}
        <div className={isMobile ? "p-4 pb-20" : "p-6"}>
          <TabsContent value="overview" className="m-0">
            <ClientOverview clientId={clientId} />
          </TabsContent>
          <TabsContent value="information" className="m-0">
            <ClientInformation clientId={clientId} />
          </TabsContent>
          <TabsContent value="cases" className="m-0">
            <ClientCases clientId={clientId} />
          </TabsContent>
          <TabsContent value="appointments" className="m-0">
            <ClientAppointments clientId={clientId} />
          </TabsContent>
          <TabsContent value="documents" className="m-0">
            <ClientDocuments clientId={clientId} />
          </TabsContent>
          <TabsContent value="tasks" className="m-0">
            <ClientTasks clientId={clientId} />
          </TabsContent>
          <TabsContent value="notes" className="m-0">
            <ClientNotes clientId={clientId} />
          </TabsContent>
          <TabsContent value="emails" className="m-0">
            <ClientEmails clientId={clientId} />
          </TabsContent>
          <TabsContent value="timeline" className="m-0">
            <ClientTimeline clientId={clientId} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Edit Dialog */}
      {showEditDialog && <EditClientDialog open={showEditDialog} onOpenChange={setShowEditDialog} client={client} onSuccess={onUpdate} />}
    </div>
    
    {/* Mobile Bottom Nav */}
    {isMobile && <BottomNavBar />}
  </>;
};