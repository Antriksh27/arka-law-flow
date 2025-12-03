import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ClientQuickActions } from './ClientQuickActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface ClientHeaderProps {
  client: any;
  onUpdate: () => void;
}
export const ClientHeader: React.FC<ClientHeaderProps> = ({
  client,
  onUpdate
}) => {
  const [portalEnabled, setPortalEnabled] = React.useState(client.client_portal_enabled ?? false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'lead':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'prospect':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handlePortalToggle = async (enabled: boolean) => {
    setIsUpdating(true);
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
      setIsUpdating(false);
    }
  };

  return <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-medium">
              {client.full_name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                {client.full_name}
                {client.is_vip && (
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" aria-label="VIP Client" />
                )}
              </h1>
              <Badge className={`${getStatusColor(client.status)} rounded-full px-3 py-1 text-sm font-medium`}>
                {client.status === 'active' ? 'Active Client' : client.status}
              </Badge>
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
              disabled={isUpdating}
            />
          </div>
          
          <ClientQuickActions 
            clientId={client.id} 
            clientName={client.full_name} 
            clientEmail={client.email}
            onAction={onUpdate} 
          />
        </div>
      </div>
    </div>;
};