import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Building, UserCheck, Users } from 'lucide-react';

interface ClientInfoSidebarProps {
  client: any;
  onUpdate: () => void;
}

export const ClientInfoSidebar: React.FC<ClientInfoSidebarProps> = ({
  client,
  onUpdate
}) => {
  return <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Litigant & Reference Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Litigant Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
            Litigant Name
          </h4>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{client.full_name}</span>
          </div>
          
          {client.type && <div className="flex items-center gap-3 text-sm">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-600">Type: </span>
                <span className="text-gray-900">{client.type}</span>
              </div>
            </div>}
          
          {client.organization && <div className="flex items-center gap-3 text-sm">
              <Building className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-600">Organization: </span>
                <span className="text-gray-900">{client.organization}</span>
              </div>
            </div>}
        </div>

        {/* Reference Information */}
        {(client.referred_by_name || client.referred_by_phone || client.source) && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              Reference Details
            </h4>
            {client.referred_by_name && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-600">Referred By: </span>
                  <span className="text-gray-900 font-medium">{client.referred_by_name}</span>
                </div>
              </div>
            )}
            {client.referred_by_phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-600">Reference Phone: </span>
                  <span className="text-gray-900">{client.referred_by_phone}</span>
                </div>
              </div>
            )}
            {client.source && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-600">Source: </span>
                  <span className="text-gray-900">{client.source}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Case Reference */}
        {client.case_ref && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              Case Reference
            </h4>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-600">Reference Number: </span>
                <span className="text-gray-900 font-mono">{client.case_ref}</span>
              </div>
            </div>
          </div>
        )}

        {/* Reference Contact */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
            Reference Contact
          </h4>
          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-600">Name: </span>
              <span className="text-gray-900">{client.referred_by_name || 'NA'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-600">Phone: </span>
              <span className="text-gray-900">{client.referred_by_phone || 'NA'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};