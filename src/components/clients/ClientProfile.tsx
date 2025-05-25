
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Edit, Mail, Phone, MapPin, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientProfileProps {
  client: any;
  onUpdate: () => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ client, onUpdate }) => {
  const { toast } = useToast();
  const [isUpdatingPortal, setIsUpdatingPortal] = useState(false);

  const handlePortalToggle = async (enabled: boolean) => {
    setIsUpdatingPortal(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ client_portal_enabled: enabled })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Client portal ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating portal access:', error);
      toast({
        title: "Error",
        description: "Failed to update portal access",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPortal(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'lead':
        return 'outline';
      case 'prospect':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'lead':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900">
          Client Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name and Status */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {client.full_name}
          </h2>
          <Badge 
            variant={getStatusBadgeVariant(client.status)}
            className={getStatusBadgeClass(client.status)}
          >
            {client.status}
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          {client.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.email}</span>
            </div>
          )}
          
          {client.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.phone}</span>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.address}</span>
            </div>
          )}
          
          {client.organization && (
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.organization}</span>
            </div>
          )}
        </div>

        {/* Assigned Lawyer */}
        {client.assigned_lawyer && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned Lawyer</h3>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={client.assigned_lawyer.profile_pic} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {client.assigned_lawyer.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-900">
                {client.assigned_lawyer.full_name}
              </span>
            </div>
          </div>
        )}

        {/* Client Portal Access */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Portal Access</h3>
              <p className="text-xs text-gray-500">
                Enable client to access their portal
              </p>
            </div>
            <Switch
              checked={client.client_portal_enabled}
              onCheckedChange={handlePortalToggle}
              disabled={isUpdatingPortal}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 space-y-2">
          <Button variant="outline" className="w-full" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Info
          </Button>
        </div>

        {/* Created Date */}
        <div className="text-xs text-gray-500 text-center">
          Client since {new Date(client.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
