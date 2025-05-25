
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Building, UserCheck } from 'lucide-react';

interface ClientInfoSidebarProps {
  client: any;
  onUpdate: () => void;
}

export const ClientInfoSidebar: React.FC<ClientInfoSidebarProps> = ({ client, onUpdate }) => {
  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{client.full_name}</span>
          </div>
          
          {client.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.email}</span>
            </div>
          )}
          
          {client.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.phone}</span>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.address}</span>
            </div>
          )}
          
          {client.organization && (
            <div className="flex items-center gap-3 text-sm">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{client.organization}</span>
            </div>
          )}
        </div>

        {/* Assigned Lawyer */}
        {client.assigned_lawyer && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3 text-sm mb-2">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">James Morrison</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
