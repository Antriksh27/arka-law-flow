import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Building, Briefcase, Users, Calendar, UserCheck, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
interface ClientInformationProps {
  clientId: string;
}
export const ClientInformation: React.FC<ClientInformationProps> = ({
  clientId
}) => {
  const {
    data: client,
    isLoading
  } = useQuery({
    queryKey: ['client-full-info', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch assigned lawyers
  const {
    data: assignedLawyers = []
  } = useQuery({
    queryKey: ['client-assigned-lawyers', clientId],
    queryFn: async () => {
      const {
        data: assignments
      } = await supabase.from('client_lawyer_assignments').select(`
          id,
          lawyer_id,
          assigned_at,
          profiles:lawyer_id (
            id,
            full_name,
            profile_pic
          )
        `).eq('client_id', clientId);
      return assignments || [];
    }
  });
  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>;
  }
  if (!client) {
    return <div className="text-center py-12 text-gray-500">
        Client information not found
      </div>;
  }
  const InfoRow = ({
    icon: Icon,
    label,
    value
  }: {
    icon: any;
    label: string;
    value: string | null | undefined;
  }) => {
    return <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="flex-1">
          <span className="text-sm text-gray-600">{label}: </span>
          <span className={`text-sm ${value ? 'font-medium text-gray-900' : 'italic text-gray-400'}`}>
            {value || 'Not provided'}
          </span>
        </div>
      </div>;
  };
  return <div className="space-y-6">
      {/* Personal Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <CardTitle>Personal Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={User} label="Full Name" value={client.full_name} />
          <InfoRow icon={Mail} label="Email" value={client.email} />
          <InfoRow icon={Phone} label="Phone" value={client.phone} />
          <InfoRow icon={UserCheck} label="Client Type" value={client.type} />
          
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm text-gray-600">Status: </span>
              <Badge className={client.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : client.status === 'inactive' ? 'bg-gray-100 text-gray-700 border-gray-200' : client.status === 'lead' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}>
                {client.status || 'Not set'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <CardTitle>Address Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={MapPin} label="Address" value={client.address} />
          <InfoRow icon={MapPin} label="District" value={client.district} />
          <InfoRow icon={MapPin} label="State" value={client.state} />
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <CardTitle>Professional Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Building} label="Organization" value={client.organization} />
          <InfoRow icon={Briefcase} label="Designation" value={client.designation} />
          <InfoRow icon={MapPin} label="Company Address" value={client.company_address} />
          <InfoRow icon={Phone} label="Company Phone" value={client.company_phone} />
          <InfoRow icon={Mail} label="Company Email" value={client.company_email} />
        </CardContent>
      </Card>

      {/* Reference Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <CardTitle>Reference Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Users} label="Referred By" value={client.referred_by_name} />
          <InfoRow icon={Phone} label="Reference Phone" value={client.referred_by_phone} />
        </CardContent>
      </Card>

      {/* Additional Notes */}
      

      {/* Services */}
      

      {/* Assigned Lawyers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <CardTitle>Assigned Lawyers</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignedLawyers.length > 0 ? assignedLawyers.map((assignment: any) => <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {assignment.profiles?.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Assigned on {new Date(assignment.assigned_at).toLocaleDateString()}
                  </p>
                </div>
              </div>) : <p className="text-sm italic text-gray-400">No lawyers assigned yet</p>}
        </CardContent>
      </Card>

      {/* Financial Details */}
      

      {/* Account Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <CardTitle>Account Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Calendar} label="Created Date" value={client.created_at ? new Date(client.created_at).toLocaleDateString() : null} />
        </CardContent>
      </Card>
    </div>;
};