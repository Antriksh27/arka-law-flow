
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Mail, Phone, MapPin, Building, Calendar, FileText } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';

interface ClientProfileProps {
  client: any;
  onUpdate: () => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ client, onUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'lead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prospect':
        return 'bg-white text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Client Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Header */}
          <div className="text-center space-y-3">
            <Avatar className="w-16 h-16 mx-auto">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {client.full_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {client.full_name}
              </h2>
              <Badge 
                className={`${getStatusColor(client.status)} rounded-full px-3 py-1`}
              >
                {client.status}
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="space-y-3">
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
          </div>

          {/* Assigned Lawyer */}
          {client.assigned_lawyer && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Assigned Lawyer
              </h3>
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

          {/* Client Since */}
          <div className="text-center pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Client since {TimeUtils.formatDate(client.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Active Cases</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-primary">₹0</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Billed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Client Info
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
