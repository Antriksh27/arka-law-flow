import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Link2, Briefcase } from 'lucide-react';
import { ClientQuickActions } from './ClientQuickActions';
interface ClientHeaderProps {
  client: any;
  onUpdate: () => void;
}
export const ClientHeader: React.FC<ClientHeaderProps> = ({
  client,
  onUpdate
}) => {
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
              <h1 className="text-2xl font-semibold text-gray-900">
                {client.full_name}
              </h1>
              <Badge className={`${getStatusColor(client.status)} rounded-full px-3 py-1 text-sm font-medium`}>
                {client.status === 'active' ? 'Active Client' : client.status}
              </Badge>
            </div>
            
          </div>
        </div>

        <div className="flex items-center gap-3">
          
          
          
          
          <ClientQuickActions clientId={client.id} clientName={client.full_name} onAction={onUpdate} />
        </div>
      </div>
    </div>;
};